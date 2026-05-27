/**
 * 用 TypeScript Compiler API 将 route.ts 中所有 check() 函数
 * 从"返回第一个匹配柱"改为"收集所有匹配柱，返回数组"。
 * 
 * 用法：node patch_route_ast.js
 * 依赖：typescript（next.js 项目自带）
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const filePath = '/Users/sunxiaolong/.qclaw/workspace/xinzhai/src/app/api/generate-card/route.ts';
const bakPath = filePath + '.bak2';

// 备份
fs.copyFileSync(filePath, bakPath);
console.log('✅ 已备份到', bakPath);

const content = fs.readFileSync(filePath, 'utf8');

// 创建 SourceFile
const sourceFile = ts.createSourceFile(
  'route.ts',
  content,
  ts.ScriptTarget.Latest,
  true
);

// 收集所有需要修改的 check 箭头函数节点
const nodesToPatch = [];

function visit(node) {
  // 找：对象字面量里的 check 属性，且值是箭头函数
  if (
    ts.isPropertyAssignment(node) &&
    node.name.getText(sourceFile) === 'check'
  ) {
    const init = node.initializer;
    if (ts.isArrowFunction(init)) {
      nodesToPatch.push(init);
    }
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);

console.log(`找到 ${nodesToPatch.length} 个 check 箭头函数`);

// 对每个箭头函数做转换
// 策略：用 transformer 重写 AST
const transformer = (context) => {
  return (rootNode) => {
    function visitor(node) {
      // 只处理我们收集到的 check 箭头函数
      if (nodesToPatch.includes(node)) {
        return patchCheckFunction(node, context.factory);
      }
      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(rootNode, visitor);
  };
};

function patchCheckFunction(arrowFn, factory) {
  // arrowFn: ArrowFunction
  
  // 1. 检查是否有 block body（有 {} 的函数体）
  if (!arrowFn.body || !ts.isBlock(arrowFn.body)) {
    console.log('  跳过：箭头函数无 block body');
    return arrowFn;
  }
  const block = arrowFn.body;
  
  // 2. 获取函数体所有语句
  const stmts = block.statements;
  
  // 3. 分析函数体，找到：
  //    - for (const p of positions) 循环语句
  //    - 循环内的 return { position: ... } return 语句
  //    - 函数末尾的 return null; 语句
  
  let forStmt = null;
  let returnNullStmt = null;
  const newStmts = [];
  
  for (const stmt of stmts) {
    // 找 for...of 循环
    if (ts.isForOfStatement(stmt)) {
      const init = stmt.initializer;
      if (ts.isVariableDeclarationList(init)) {
        const decls = init.declarations;
        if (decls.length === 1 && decls[0].name.getText(sourceFile) === 'p') {
          forStmt = stmt;
        }
      }
    }
    // 找 return null;
    if (ts.isReturnStatement(stmt) && !stmt.expression) {
      // return; （无值）
    } else if (ts.isReturnStatement(stmt) && stmt.expression) {
      const expr = stmt.expression;
      if (expr.kind === ts.SyntaxKind.NullKeyword) {
        returnNullStmt = stmt;
      }
    }
  }
  
  if (!forStmt) {
    console.log('  跳过：未找到 for (const p of positions) 循环');
    return arrowFn;
  }
  
  // 4. 构建新的函数体语句
  const newStatements = [];
  
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    
    // 在 for 循环之前插入 const results = [];
    if (stmt === forStmt) {
      // 插入 results 初始化（在 for 循环之前）
      const resultsDecl = factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier('results'),
              undefined,
              factory.createTypeReferenceNode(
                factory.createIdentifier('Array'),
                [
                  factory.createTypeLiteralNode([
                    factory.createPropertySignature(
                      undefined,
                      factory.createIdentifier('position'),
                      undefined,
                      factory.createTypeReferenceNode('string', [])
                    ),
                    factory.createPropertySignature(
                      undefined,
                      factory.createIdentifier('description'),
                      undefined,
                      factory.createTypeReferenceNode('string', [])
                    ),
                    factory.createPropertySignature(
                      [factory.createToken(ts.SyntaxKind.QuestionToken)],
                      factory.createIdentifier('warning'),
                      undefined,
                      factory.createTypeReferenceNode('string', [])
                    ),
                  ])
                ]
              ),
              factory.createArrayLiteralExpression([], false)
            ),
          ],
          ts.NodeFlags.Const
        )
      );
      newStatements.push(resultsDecl);
    }
    
    // 处理 for 循环：把循环内的 return { position } 改为 results.push(...)
    if (stmt === forStmt) {
      const newForStmt = patchForLoop(stmt, factory, sourceFile);
      newStatements.push(newForStmt);
      continue;
    }
    
    // 把 return null; 改为 return results.length > 0 ? results : null;
    if (stmt === returnNullStmt && returnNullStmt) {
      const newReturn = factory.createReturnStatement(
        factory.createConditionalExpression(
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('results'),
              'length'
            ),
            factory.createToken(ts.SyntaxKind.GreaterThanToken),
            factory.createNumericLiteral('0')
          ),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createIdentifier('results'),
          factory.createToken(ts.SyntaxKind.ColonToken),
          factory.createNull()
        )
      );
      newStatements.push(newReturn);
      continue;
    }
    
    newStatements.push(stmt);
  }
  
  // 创建新的 block
  const newBlock = factory.createBlock(newStatements, true);
  
  // 创建新的箭头函数
  return factory.createArrowFunction(
    arrowFn.modifiers,
    arrowFn.typeParameters,
    arrowFn.parameters,
    arrowFn.type,
    arrowFn.equalsGreaterThanToken,
    newBlock
  );
}

function patchForLoop(forStmt, factory, sourceFile) {
  // 找到循环体内的 return { position: posLabel(p), ... } 语句
  // 替换为 results.push({ position: posLabel(p), ... });
  
  function visitLoopBody(node) {
    if (ts.isReturnStatement(node) && node.expression) {
      const expr = node.expression;
      // 检查是否是 { position: ..., description: ..., warning?: ... }
      if (ts.isObjectLiteralExpression(expr)) {
        // 替换为 results.push(expr);
        const pushStmt = factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('results'),
              'push'
            ),
            undefined,
            [expr]
          )
        );
        return pushStmt;
      }
    }
    return ts.visitEachChild(node, visitLoopBody, undefined);
  }
  
  const newBody = ts.visitNode(forStmt.statement, visitLoopBody);
  
  return factory.createForOfStatement(
    forStmt.awaitModifier,
    forStmt.initializer,
    forStmt.expression,
    newBody
  );
}

// 应用 transformer
const result = ts.transform(sourceFile, [transformer]);
const transformedSourceFile = result.transformed[0];

// 打印回字符串
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const newContent = printer.printFile(transformedSourceFile);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ route.ts AST 转换完成');
console.log('   原长度:', content.length, '字符');
console.log('   新长度:', newContent.length, '字符');
