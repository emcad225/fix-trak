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
  const username = (await ask("اسم المستخدم: ")).toLowerCase();
  const name = await ask("الاسم الظاهر: ");
  const password = await ask("كلمة السر (12 حرف على الأقل): ", true);
  const again = await ask("أعد كتابتها: ", true);

  if (!username || !name) throw new Error("الاسم واسم المستخدم مطلوبين");
  if (password.length < 12) throw new Error("كلمة السر أقصر من 12 حرف");
  if (password !== again) throw new Error("كلمتا السر غير متطابقتين");

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) throw new Error("اسم المستخدم موجود مسبقاً");

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.user.create({
    data: { username, name, passwordHash, role: "PLATFORM_ADMIN" },
  });

  console.log("تم إنشاء حساب مدير المنصة:", username);
}

main()
  .catch((e) => {
    console.error("فشل:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());