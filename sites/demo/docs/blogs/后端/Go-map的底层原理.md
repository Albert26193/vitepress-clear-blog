---
page_id: "Go-map的底层原理"
author: Albert
date modified: 2024-02-27
date created: 2024-02-20
tags:
  - Blog
  - Go
  - Interview
title: Go-map的底层原理
---

# Go-map 的底层原理

## 1. 整体流程

![image.png|475](https://img-20221128.oss-cn-shanghai.aliyuncs.com/img-2023-05/20240227170151.png)

- 通过哈希函数，将 `key` 散列化，得到一个 `64` 位的哈希值，这个哈希值决定了两点：
  1.  `value` 会落到那个“区间”当中。
  2.  在该区间当中，`value` 具体在哪个位置上。
- 在 `Go` 的设计当中，这个所谓的区间，称为桶 `bucket`，桶通过名为 `hmap` 的结构体进行组织

---

- `Go` 当中的 `map` 是一个指针，占用 `8` 个字节，指向 `hmap` 结构体

```go
// A header for a Go map.
type hmap struct {
    // 元素个数，调用 len(map) 时，直接返回此值
	count     int
	flags     uint8
	// buckets 的对数 log_2
	B         uint8
	// overflow 的 bucket 近似数
	noverflow uint16
	// 计算 key 的哈希的时候会传入哈希函数
	hash0     uint32
    // 指向 buckets 数组，大小为 2^B
    // 如果元素个数为0，就为 nil
	buckets    unsafe.Pointer
	// 等量扩容的时候，buckets 长度和 oldbuckets 相等
	// 双倍扩容的时候，buckets 长度会是 oldbuckets 的两倍
	oldbuckets unsafe.Pointer
	// 指示扩容进度，小于此地址的 buckets 迁移完成
	nevacuate  uintptr
	extra *mapextra // optional fields
}
```

- 每个 `hmap` 结构体都会指向底层的 `bmap` 结构体，也就是上文所说的 _桶_。
- 具体是如何找到 `hmap` 的呢？**哈希值的低 `B` 位，决定了会落到那个桶当中**。

![image.png|675](https://img-20221128.oss-cn-shanghai.aliyuncs.com/img-2023-05/20240220221735.png)

Map 底层是由 hmap 和 bmap 两个结构体实现的。

```go
// A header for a Go map.
type hmap struct {
    // 元素个数，调用 len(map) 时，直接返回此值
	count     int
	flags     uint8
	// buckets 的对数 log_2
	B         uint8
	// overflow 的 bucket 近似数
	noverflow uint16
	// 计算 key 的哈希的时候会传入哈希函数
	hash0     uint32
    // 指向 buckets 数组，大小为 2^B
    // 如果元素个数为0，就为 nil
	buckets    unsafe.Pointer
	// 扩容的时候，buckets 长度会是 oldbuckets 的两倍
	oldbuckets unsafe.Pointer
	// 指示扩容进度，小于此地址的 buckets 迁移完成
	nevacuate  uintptr
	extra *mapextra // optional fields
}
```

- 其中，B 是 buckets 数组的长度的对数，也就是说 buckets 数组的长度就是 2^B。buckets 里面存储了 key 和 value，后面会再讲。buckets 指向 bmap 结构体：

```go
type bmap struct {
	tophash [bucketCnt]uint8
}

type bmap struct {
    topbits  [8]uint8
    keys     [8]keytype
    values   [8]valuetype
    pad      uintptr
    overflow uintptr
}
```

- bmap 被称之为“桶”。一个桶里面会最多装 8 个 key，key 经过哈希计算后，哈希结果是“一类”的将会落入到同一个桶中。在桶内，会根据 key 计算出来的 hash 值的高 8 位来决定 key 到底落入桶内的哪个位置。
- 注：一个桶内最多有 8 个位置。 这也是为什么 map 无法使用 cap()来求容量的关键原因：map 的容量是编译器进行计算后得出的一个结果，由于桶的存在，map 在内存中实际存放的大小不一定同 make 出来后的 map 的大小一致。
- 有一点需要注意：当 map 的 key 和 value 都不是指针，并且 size 都小于 128 字节的情况下，会把 bmap 标记为不含指针，这样可以避免 gc 时扫描整个 hmap。尽管如此，但如图所示，bmap 是有一个 overflow 的字段，该字段是指针类型，这就破坏了 bmap 不含指针的设想，这时会把 overflow 移动到 extra 字段来。

---

bmp 也就是 bucket，由初始化的结构体可知，里面最多存 8 个 key，每个 key 落在桶的位置有 hash 出来的结果的高 8 位决定。

其中 tophash 是一个长度为 8 的整型数组，Hash 值相同的键存入当前 bucket 时会将 Hash 值的高位存储在该数组中，以便后续匹配。

整体图如下

![image.png](https://img-20221128.oss-cn-shanghai.aliyuncs.com/img-2023-05/20240220222256.png)

Go map 底层实现方式是 Hash 表（C++ map 基于红黑树实现，而 C++ 11 新增的 unordered_map 则与 Go map 类似，都是基于 Hash 表实现）。Go map 的数据被置入一个由桶组成的有序数组中，每个桶最多可以存放 8 个 key/value 对。key 的 Hash 值低位用于在该数组中定位到桶，而高 8 位则用于在桶中区分 key/value 对。
