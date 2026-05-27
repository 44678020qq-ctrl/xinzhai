/**
 * 用 ts-morph 将 route.ts 中所有 check() 函数
 * 从"返回第一个匹配柱"改为"收集所有匹配柱，返回数组"。
 */
const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const filePath = '/Users/sunxiaolong/.qclaw/workspace/xinzhai/src/app/api/generate-card/route.ts';
const bakPath = filePath + '.bak3';

// 备份
fs.copyFileSync(filePath, bakPath);
console.log('✅ 已备份到', bakPath);

const project = new Project();
const sourceFile = project.addSourceFileAtPath(filePath);

// 遍历所有对象字面量属性，找到 name === 'check' 且 initializer 是箭头函数的
let patchCount = 0;

sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach(prop => {
  const nameNode = prop.getNameNode();
  const propName = nameNode.getText();
  if (propName !== 'check') return;

  const init = prop.getInitializer();
  if (!init || !init.isKind(SyntaxKind.ArrowFunction)) return;

  const arrowFn = init;
  const body = arrowFn.getBody();
  if (!body || !body.isKind(SyntaxKind.Block)) return;

  const block = body;
  const stmts = block.getStatements();

  // 检查是否有 for...of 循环（遍历 positions）
  const forOfs = block.getDescendantsOfKind(SyntaxKind.ForOfStatement);
  if (forOfs.length === 0) {
    console.log('  ⚠️ 跳过：无 for...of 循环（' + getFuncName(prop) + '）');
    return;
  }

  // 1. 在 for...of 循环前插入 const results = [];
  const firstFor = forOfs[0];
  const resultsType = 'Array<{position: string; description: string; warning?: string}>';
  
  // 找 for 循环前面的最后一条语句，在它后面插入
  // 更简单：在 for 循环语句之前插入
  const forStmt = firstFor.getParentWhileOrThrow(p => p !== block);
  
  // 用 block.insertStatements 在 for 循环之前插入
  const forIdx = block.getStatements().indexOf(firstFor);
  if (forIdx < 0) { console.log('  ⚠️ 找不到 for 循环索引'); return; }
  
  block.insertStatements(forIdx, `const results: ${resultsType} = [];`);
  console.log('  ✅ 插入 results 初始化（' + getFuncName(prop) + '）');

  // 2. 把 for 循环内所有 return { position: ... } 改为 results.push(...)
  let pushCount = 0;
  for (const forStmt of forOfs) {
    forStmt.getDescendantsOfKind(SyntaxKind.ReturnStatement).forEach(ret => {
      const expr = ret.getExpression();
      if (!expr || !expr.isKind(SyntaxKind.ObjectLiteralExpression)) return;
      
      // 替换为 results.push(...)
      const objText = expr.getText();
      ret.replaceWithText(`results.push(${objText});`);
      pushCount++;
    });
  }
  console.log('  ✅ 替换 ' + pushCount + ' 个 return 为 results.push（' + getFuncName(prop) + '）');

  // 3. 把函数末尾的 return null; 改为 return results.length > 0 ? results : null;
  // 重新获取语句（因为插入了 results 初始化，索引可能变了）
  const newStmts = block.getStatements();
  let replaced = false;
  for (let i = newStmts.length - 1; i >= 0; i--) {
    const s = newStmts[i];
    if (s.isKind(SyntaxKind.ReturnStatement)) {
      const retExpr = s.getExpression();
      if (!retExpr || !retExpr.isKind(SyntaxKind.NullKeyword)) continue;
      
      s.replaceWithText('return results.length > 0 ? results : null;');
      replaced = true;
      console.log('  ✅ 替换 return null 为 return results.length > 0 ? results : null（' + getFuncName(prop) + '）');
      break; // 只替换第一个（从后往前找，即函数末尾那个）
    }
  }
  if (!replaced) {
    console.log('  ⚠️ 未找到 return null;（' + getFuncName(prop) + '）');
  }

  patchCount++;
});

function getFuncName(prop) {
  // 找前面的 name: '...' 语句
  const parent = prop.getParent();
  if (!parent || !parent.isKind(SyntaxKind.ObjectLiteralExpression)) return 'unknown';
  const nameProp = parent.getDescendantsOfKind(SyntaxKind.PropertyAssignment).find(p => p.getNameNode().getText() === 'name');
  if (!nameProp) return 'unknown';
  const init = nameProp.getInitializer();
  if (!init) return 'unknown';
  return init.getText().replace(/['"]/g, '');
}

// 保存
sourceFile.saveSync();
console.log('\n✅ 完成！共修补 ' + patchCount + ' 个 check 函数');
console.log('   原文件:', fs.readFileSync(bakPath, 'utf8').length, '字符');
console.log('   新文件:', fs.readFileSync(filePath, 'utf8').length, '字符');
