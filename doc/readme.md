## 基本原理

和 evaa master contract 交互主要有三个行为，存钱，取钱，清算。
存钱 op 为 0x1
取钱 op 为 0x2
清算 op 为 0x3
所以如果我们想实时监控 evaa user contract 的状态主要关注这三个 op 即可，如果有新的 tx 提交，我们就根据 user contract address 去更新他的借贷信息。

根据观察，其实 master contract 的交易不是很频繁，没啥太大压力。
