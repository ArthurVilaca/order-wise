// src/services/prismaService.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUser = async (email: string) => {
  return await prisma.user.findFirst({ where: { email } });
}

export const getMessages = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return;

  const messages = await prisma.message.findMany({
    where: { userId: user!.id },
    include: {
      user: true,
    },
  });

  return messages;
};

export const saveMessage = async (content: string, email: string) => {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error("User not found");

  return prisma.message.create({
    data: {
      content,
      userId: user.id,
    },
  });
};
