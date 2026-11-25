import "dotenv/config";
import readline from "node:readline";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl._writeToOutput = (text) => {
      if (hidden && !text.includes(question)) rl.output.write("*");
      else rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    console.log("القاعدة:", url.host + url.pathname);
  } catch {
    throw new Error("DATABASE_URL مفقود أو غير صالح");
  }

  const username = (await ask("اسم المستخدم: ")).toLowerCase();
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) throw new Error("المستخدم غير موجود بهالقاعدة");

  const password = await ask("كلمة السر الجديدة (16 حرف على الأقل): ", true);
  const again = await ask("أعد كتابتها: ", true);

  if (password.length < 16) throw new Error("كلمة السر أقصر من 16 حرف");
  if (password !== again) throw new Error("كلمتا السر غير متطابقتين");

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, isActive: true },
  });

  console.log("تم تعيين كلمة السر الجديدة لـ", username);
}

main()
  .catch((e) => console.error("فشل:", e.message))
  .finally(() => prisma.$disconnect());