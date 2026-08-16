---
page_id: "mathjax-showcase"
title: MathJax 数学公式全展示
date: 2026-05-09
tags:
  - mathjax
  - latex
  - mathematics
  - extension
description: 行内公式、块级公式、矩阵、积分、求和等 LaTeX 语法全展示
---

# MathJax 数学公式全展示

MathJax 扩展启用后，可以在 Markdown 中书写 LaTeX 数学公式。本文覆盖所有常用语法。

## 行内公式

行内公式使用 `$...$` 包裹：$E = mc^2$、$a^2 + b^2 = c^2$、$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$。

## 块级公式

块级公式使用 `$$...$$` 包裹，独立成行居中显示：

$$
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

## 矩阵

### pmatrix（圆括号矩阵）

$$
\begin{pmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{pmatrix}
$$

### bmatrix（方括号矩阵）

$$
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

### 行列式

$$
\begin{vmatrix}
x & y \\
z & w
\end{vmatrix} = xw - yz
$$

## 积分与极限

$$
\iint_D f(x,y) \,dx\,dy
$$

$$
\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e
$$

## 求和与乘积

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
\prod_{i=1}^{n} i = n!
$$

## 希腊字母

$\alpha \beta \gamma \delta \epsilon \zeta \eta \theta \lambda \mu \nu \xi \pi \rho \sigma \tau \phi \chi \psi \omega$

大写：$\Gamma \Delta \Theta \Lambda \Xi \Pi \Sigma \Phi \Psi \Omega$

## 多行对齐公式

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0\epsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 公式编号

$$
F = G\frac{m_1 m_2}{r^2} \tag{1}
$$

引用公式 $(1)$ 即可。

## 常见符号

- 集合：$\forall \exists \in \notin \subset \supset \cup \cap \emptyset$
- 关系：$\leq \geq \neq \approx \equiv \sim \propto$
- 箭头：$\rightarrow \Rightarrow \leftrightarrow \Leftrightarrow$
- 特殊：$\infty \partial \nabla \hbar \degree$

## 相关文档

- [[../mermaid-diagrams-comprehensive|Mermaid 图表大全]]
- [[../callout-types|Callout 类型]]
- [[../../basics/tables-lists-images|表格列表图片]]
