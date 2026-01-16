import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDependencyDto } from './dto/create-dependency.dto';

@Injectable()
export class TaskDependenciesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateDependencyDto, companyId: string) {
    // Proveri da oba taska postoje i pripadaju istoj kompaniji
    const [dependentTask, dependsOnTask] = await Promise.all([
      this.prisma.task.findFirst({
        where: { id: createDto.dependentTaskId },
        include: { client: true },
      }),
      this.prisma.task.findFirst({
        where: { id: createDto.dependsOnTaskId },
        include: { client: true },
      }),
    ]);

    if (!dependentTask || !dependsOnTask) {
      throw new NotFoundException('Jedan ili oba taska ne postoje');
    }

    if (dependentTask.client.companyId !== companyId || dependsOnTask.client.companyId !== companyId) {
      throw new BadRequestException('Taskovi ne pripadaju vašoj kompaniji');
    }

    // Proveri circular dependency
    const wouldCreateCycle = await this.checkCircularDependency(
      createDto.dependentTaskId,
      createDto.dependsOnTaskId,
    );

    if (wouldCreateCycle) {
      throw new BadRequestException('Ova zavisnost bi kreirala cikličnu zavisnost');
    }

    // Proveri da već ne postoji ista zavisnost
    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        dependentTaskId_dependsOnTaskId: {
          dependentTaskId: createDto.dependentTaskId,
          dependsOnTaskId: createDto.dependsOnTaskId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Ova zavisnost već postoji');
    }

    return this.prisma.taskDependency.create({
      data: {
        dependentTaskId: createDto.dependentTaskId,
        dependsOnTaskId: createDto.dependsOnTaskId,
        type: createDto.type || 'FINISH_TO_START',
      },
      include: {
        dependentTask: true,
        dependsOnTask: true,
      },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.taskDependency.findMany({
      where: {
        OR: [
          { dependentTaskId: taskId },
          { dependsOnTaskId: taskId },
        ],
      },
      include: {
        dependentTask: true,
        dependsOnTask: true,
      },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.taskDependency.findMany({
      where: {
        dependentTask: { clientId },
      },
      include: {
        dependentTask: true,
        dependsOnTask: true,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { id },
      include: {
        dependentTask: {
          include: { client: true },
        },
      },
    });

    if (!dependency) {
      throw new NotFoundException('Zavisnost nije pronađena');
    }

    if (dependency.dependentTask.client.companyId !== companyId) {
      throw new BadRequestException('Nemate pristup ovoj zavisnosti');
    }

    return this.prisma.taskDependency.delete({
      where: { id },
    });
  }

  // Provera circular dependency korišćenjem DFS
  private async checkCircularDependency(
    dependentTaskId: string,
    dependsOnTaskId: string,
  ): Promise<boolean> {
    // Ne možeš zavisiti od sebe
    if (dependentTaskId === dependsOnTaskId) {
      return true;
    }

    // Proveri da li dependsOnTask (direktno ili indirektno) zavisi od dependentTask
    const visited = new Set<string>();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      
      if (currentId === dependentTaskId) {
        return true; // Ciklus pronađen
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // Nađi sve taskove od kojih trenutni zavisi
      const dependencies = await this.prisma.taskDependency.findMany({
        where: { dependentTaskId: currentId },
        select: { dependsOnTaskId: true },
      });

      for (const dep of dependencies) {
        stack.push(dep.dependsOnTaskId);
      }
    }

    return false;
  }
}
