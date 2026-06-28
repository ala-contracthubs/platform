import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** Cross-cutting database access, imported by any module that needs it. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
