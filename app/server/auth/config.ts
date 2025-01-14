import GitHubProvider from "next-auth/providers/github";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authConfig = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    async signIn({ user }: { user: { name: string; email: string } }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!dbUser) {
        await prisma.user.create({
          data: { name: user.name, email: user.email },
        });
      }

      return true;
    },
  },
};
