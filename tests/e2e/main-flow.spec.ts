import { expect, test } from "@playwright/test";

test("registers locally and reaches the core app flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "心斋" })).toBeVisible();
  await page.getByRole("link", { name: "开始入斋" }).click();

  await expect(page.getByRole("heading", { name: "先认识一下你" })).toBeVisible();
  await page.getByPlaceholder("如何称呼你").fill("测试用户");
  await page.getByRole("button", { name: "女" }).click();
  await page.getByPlaceholder("1998").fill("1998");
  await page.getByPlaceholder("10").fill("10");
  await page.getByPlaceholder("12").fill("12");
  await page.getByRole("button", { name: /辰时/ }).click();
  await page.getByRole("button", { name: /生成我的能量名片/ }).click();

  await expect(page).toHaveURL(/\/card/);
  await expect(page.getByText("正在生成能量名片…")).toBeHidden();
  await page.getByRole("button", { name: /看看谁能和你共鸣/ }).click();

  await expect(page).toHaveURL(/\/match/);
  await expect(page.getByRole("heading", { name: "遇合" })).toBeVisible();
  await expect(page.getByRole("button", { name: "恋人" })).toBeVisible();
  await page.getByRole("button", { name: "玩伴" }).click();
  await page.getByRole("button", { name: /开始对谈/ }).first().click();

  await expect(page).toHaveURL(/\/chat/);
  await expect(page.getByPlaceholder("说点什么…")).toBeVisible();

  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "我" })).toBeVisible();
  await expect(page.getByRole("link", { name: "隐私政策" })).toBeVisible();
});

test("legal pages are reachable from the entry page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "隐私政策" }).click();
  await expect(page.getByRole("heading", { name: "隐私政策" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "用户协议" }).click();
  await expect(page.getByRole("heading", { name: "用户协议" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "数据删除" }).click();
  await expect(page.getByRole("heading", { name: "数据删除说明" })).toBeVisible();
});
