# Network Audit Report

**Generated**: 2026-05-28T03:51:32.219014

## Interfaces

| Interface | RX Bytes | RX Packets | RX Errs | RX Drops | TX Bytes | TX Packets | TX Errs | TX Drops |
|---|---|---|---|---|---|---|---|---|
| lo | 22,299,319,540 | 6,085,700 | 0 | 0 | 22,299,319,540 | 6,085,700 | 0 | 0 |
| enp0s31f6 | 65,268,646,552 | 150,893,138 | 0 | 116 | 62,219,086,580 | 175,024,340 | 0 | 0 |
| wlp1s0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| docker0 | 1,247,961,832 | 369,801 | 0 | 0 | 72,688,051 | 895,516 | 0 | 0 |
| tailscale0 | 1,581,854,380 | 4,105,920 | 0 | 0 | 5,608,221,706 | 2,452,322 | 0 | 0 |
| vethb6e5395 | 1,252,940,362 | 369,019 | 0 | 0 | 72,072,293 | 894,496 | 0 | 0 |

## Routing Table

| Interface | Destination | Gateway | Mask |
|---|---|---|---|
| enp0s31f6 | 0.0.0.0 | 192.168.1.254 | 0.0.0.0 |
| enp0s31f6 | 169.254.0.0 | 0.0.0.0 | 255.255.0.0 |
| docker0 | 172.17.0.0 | 0.0.0.0 | 255.255.0.0 |
| enp0s31f6 | 192.168.1.0 | 0.0.0.0 | 255.255.255.0 |

## ARP Table

| IP | MAC | Flags | Device |
|---|---|---|---|
| 192.168.1.252 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.251 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.222 | f8:ac:65:a7:b2:3c | 0x2 | enp0s31f6 |
| 192.168.1.106 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.92 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.30 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.254 | 00:0f:94:f5:f6:41 | 0x2 | enp0s31f6 |
| 192.168.1.75 | 3a:df:30:bb:60:3d | 0x2 | enp0s31f6 |
| 192.168.1.239 | 62:75:5e:ca:74:e3 | 0x0 | enp0s31f6 |
| 192.168.1.234 | 7c:21:4a:b9:e8:da | 0x2 | enp0s31f6 |
| 192.168.1.178 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.253 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 169.254.169.254 | 00:00:00:00:00:00 | 0x0 | enp0s31f6 |
| 192.168.1.248 | 36:05:92:bb:f3:18 | 0x2 | enp0s31f6 |
| 172.17.0.2 | 02:42:ac:11:00:02 | 0x2 | docker0 |

## DNS Configuration

**Nameservers**: 8.8.8.8, 1.1.1.1, 192.168.1.254

## Local Hosts

| IP | Names |
|---|---|
| 127.0.0.1 | localhost |
| 127.0.1.1 | jan |
| ::1 | localhost, ip6-localhost, ip6-loopback |
| ff02::1 | ip6-allnodes |
| ff02::2 | ip6-allrouters |
| 91.184.18.250 | mail.hostnet.nl, imap.hostnet.nl, smtp.hostnet.nl |
| 100.68.121.19 | bc-scan-arm |

## TCP Connections

- **LISTEN**: 12
- **ESTABLISHED**: 21
- **TIME_WAIT**: 8
- **CLOSE_WAIT**: 0
- **Total entries**: 41

### Listening Ports (TCP)

| Local Address | State |
|---|---|
| 127.0.0.1:20241 | LISTEN |
| 100.81.124.47:38454 | LISTEN |
| 100.81.124.47:22 | LISTEN |
| 0.0.0.0:8080 | LISTEN |
| 127.0.0.1:41709 | LISTEN |
| 127.0.0.1:9050 | LISTEN |
| 127.0.0.1:9051 | LISTEN |
| 127.0.0.1:9052 | LISTEN |
| 127.0.0.1:9053 | LISTEN |
| 127.0.0.1:9054 | LISTEN |
| 127.0.0.1:53 | LISTEN |
| 192.168.1.145:22 | LISTEN |

### External Services (ESTABLISHED)

- **HTTPS**: 17 unique peer(s) — 104.18.28.234, 104.18.29.234, 130.211.34.183, 140.82.112.22, 142.251.142.211...

## UDP Endpoints

- **Total entries**: 7

## Socket Statistics

- **tcp_inuse**: 33
- **tcp_orphan**: 0
- **tcp_tw**: 8
- **tcp_alloc**: 42
- **udp_inuse**: 7

## IP / TCP / UDP / ICMP Statistics

### IP

- Forwarding: 1
- DefaultTTL: 64
- InReceives: 190547881
- InHdrErrors: 3
- InAddrErrors: 0
- ForwDatagrams: 1238607
- InUnknownProtos: 0
- InDiscards: 0
- InDelivers: 188975292
- OutRequests: 215400646
- OutDiscards: 488587
- OutNoRoutes: 186
- ReasmTimeout: 0
- ReasmReqds: 46
- ReasmOKs: 23
- ReasmFails: 0
- FragOKs: 0
- FragFails: 0
- FragCreates: 0

### ICMP

- InMsgs: 1001333
- InErrors: 8142
- InCsumErrors: 0
- InDestUnreachs: 1000004
- InTimeExcds: 377
- InParmProbs: 0
- InSrcQuenchs: 0
- InRedirects: 9
- InEchos: 191
- InEchoReps: 752
- InTimestamps: 0
- InTimestampReps: 0
- InAddrMasks: 0
- InAddrMaskReps: 0
- OutMsgs: 153742
- OutErrors: 0
- OutRateLimitGlobal: 5215
- OutRateLimitHost: 2218
- OutDestUnreachs: 149965
- OutTimeExcds: 3
- OutParmProbs: 0
- OutSrcQuenchs: 0
- OutRedirects: 0
- OutEchos: 3584
- OutEchoReps: 190
- OutTimestamps: 0
- OutTimestampReps: 0
- OutAddrMasks: 0
- OutAddrMaskReps: 0

### TCP

- RtoAlgorithm: 1
- RtoMin: 200
- RtoMax: 120000
- MaxConn: -1
- ActiveOpens: 2059923
- PassiveOpens: 58282
- AttemptFails: 68454
- EstabResets: 208578
- CurrEstab: 23
- InSegs: 125455721
- OutSegs: 141560690
- RetransSegs: 4681623
- InErrs: 887
- OutRsts: 420014
- InCsumErrors: 0

### UDP

- InDatagrams: 62560535
- NoPorts: 13296
- InErrors: 5
- OutDatagrams: 84251586
- RcvbufErrors: 5
- SndbufErrors: 0
- InCsumErrors: 0
- IgnoredMulti: 175
- MemErrors: 0

## Anomalies & Warnings

- ⚠️ Interface enp0s31f6 has 116 RX drops and 0 TX drops
- ⚠️ High TCP retransmissions: 4,681,623 — possible congestion or packet loss
- ⚠️ High TCP connection attempt failures: 68,454
- ⚠️ UDP input errors: 5
- ⚠️ High ICMP errors: 8,142

## Summary

- Active interfaces: 5
- Total TCP connections tracked: 41
- Established outbound connections: 21
- TCP retransmissions (lifetime): 4,681,623
- UDP input errors: 5
- ICMP errors: 8,142
- ARP entries: 15

