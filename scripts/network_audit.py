#!/usr/bin/env python3
"""Network audit script — collects and analyzes network state from /proc/net."""
import re
import struct
import sys
from datetime import datetime
from pathlib import Path

def hex_ip_to_str(val: str) -> str:
    """Convert /proc/net little-endian hex IP to dotted quad."""
    try:
        n = int(val, 16)
        return ".".join(str(b) for b in struct.pack("<I", n))
    except Exception:
        return val

def hex_port_to_int(val: str) -> int:
    try:
        return int(val, 16)
    except Exception:
        return 0

def tcp_state(st: str) -> str:
    states = {
        "01": "ESTABLISHED",
        "02": "SYN_SENT",
        "03": "SYN_RECV",
        "04": "FIN_WAIT1",
        "05": "FIN_WAIT2",
        "06": "TIME_WAIT",
        "07": "CLOSE",
        "08": "CLOSE_WAIT",
        "09": "LAST_ACK",
        "0A": "LISTEN",
        "0B": "CLOSING",
        "0C": "NEW_SYN_RECV",
    }
    return states.get(st.upper(), f"UNKNOWN({st})")

def parse_tcp_udp(path: str, proto: str = "tcp"):
    lines = Path(path).read_text().splitlines()
    if not lines:
        return []
    conns = []
    for line in lines[1:]:
        parts = line.split()
        if len(parts) < 4:
            continue
        local = parts[1]
        rem = parts[2]
        st = parts[3]
        local_ip, local_port = local.split(":")
        rem_ip, rem_port = rem.split(":")
        conns.append({
            "proto": proto,
            "local": f"{hex_ip_to_str(local_ip)}:{hex_port_to_int(local_port)}",
            "remote": f"{hex_ip_to_str(rem_ip)}:{hex_port_to_int(rem_port)}",
            "state": tcp_state(st) if proto == "tcp" else "",
            "raw_state": st,
        })
    return conns

def parse_dev():
    lines = Path("/proc/net/dev").read_text().splitlines()
    devs = []
    for line in lines[2:]:
        parts = line.split(":")
        if len(parts) != 2:
            continue
        iface = parts[0].strip()
        nums = [int(x) for x in parts[1].split()]
        if len(nums) < 16:
            continue
        rx_bytes, rx_packets, rx_errs, rx_drop = nums[0], nums[1], nums[2], nums[3]
        tx_bytes, tx_packets, tx_errs, tx_drop = nums[8], nums[9], nums[10], nums[11]
        devs.append({
            "iface": iface,
            "rx_bytes": rx_bytes, "rx_packets": rx_packets,
            "rx_errs": rx_errs, "rx_drop": rx_drop,
            "tx_bytes": tx_bytes, "tx_packets": tx_packets,
            "tx_errs": tx_errs, "tx_drop": tx_drop,
        })
    return devs

def parse_route():
    lines = Path("/proc/net/route").read_text().splitlines()
    routes = []
    for line in lines[1:]:
        parts = line.split()
        if len(parts) < 3:
            continue
        iface = parts[0]
        dest = hex_ip_to_str(parts[1])
        gw = hex_ip_to_str(parts[2])
        mask = hex_ip_to_str(parts[7])
        routes.append({"iface": iface, "dest": dest, "gateway": gw, "mask": mask})
    return routes

def parse_arp():
    lines = Path("/proc/net/arp").read_text().splitlines()
    arp = []
    for line in lines[1:]:
        parts = line.split()
        if len(parts) < 6:
            continue
        ip = parts[0]
        hw = parts[3]
        flags = parts[2]
        dev = parts[5]
        arp.append({"ip": ip, "mac": hw, "flags": flags, "dev": dev})
    return arp

def parse_snmp():
    text = Path("/proc/net/snmp").read_text()
    data = {}
    for line in text.splitlines():
        if line.startswith("Tcp: ") and not line.startswith("Tcp: Rto"):
            keys = "RtoAlgorithm RtoMin RtoMax MaxConn ActiveOpens PassiveOpens AttemptFails EstabResets CurrEstab InSegs OutSegs RetransSegs InErrs OutRsts InCsumErrors".split()
            vals = line.split()[1:]
            data["tcp"] = dict(zip(keys, vals))
        elif line.startswith("Udp: ") and not line.startswith("Udp: InDat"):
            keys = "InDatagrams NoPorts InErrors OutDatagrams RcvbufErrors SndbufErrors InCsumErrors IgnoredMulti MemErrors".split()
            vals = line.split()[1:]
            data["udp"] = dict(zip(keys, vals))
        elif line.startswith("Ip: ") and not line.startswith("Ip: Forward"):
            keys = "Forwarding DefaultTTL InReceives InHdrErrors InAddrErrors ForwDatagrams InUnknownProtos InDiscards InDelivers OutRequests OutDiscards OutNoRoutes ReasmTimeout ReasmReqds ReasmOKs ReasmFails FragOKs FragFails FragCreates".split()
            vals = line.split()[1:]
            data["ip"] = dict(zip(keys, vals))
        elif line.startswith("Icmp: ") and not line.startswith("Icmp: InMsgs"):
            keys = "InMsgs InErrors InCsumErrors InDestUnreachs InTimeExcds InParmProbs InSrcQuenchs InRedirects InEchos InEchoReps InTimestamps InTimestampReps InAddrMasks InAddrMaskReps OutMsgs OutErrors OutRateLimitGlobal OutRateLimitHost OutDestUnreachs OutTimeExcds OutParmProbs OutSrcQuenchs OutRedirects OutEchos OutEchoReps OutTimestamps OutTimestampReps OutAddrMasks OutAddrMaskReps".split()
            vals = line.split()[1:]
            data["icmp"] = dict(zip(keys, vals))
    return data

def parse_sockstat():
    lines = Path("/proc/net/sockstat").read_text().splitlines()
    stats = {}
    for line in lines:
        if line.startswith("TCP:"):
            parts = line.split()
            stats["tcp_inuse"] = parts[2]
            stats["tcp_orphan"] = parts[4]
            stats["tcp_tw"] = parts[6]
            stats["tcp_alloc"] = parts[8]
        elif line.startswith("UDP:"):
            parts = line.split()
            stats["udp_inuse"] = parts[2]
    return stats

def parse_resolv():
    p = Path("/etc/resolv.conf")
    if not p.exists():
        return []
    servers = []
    for line in p.read_text().splitlines():
        line = line.strip()
        if line.startswith("nameserver"):
            servers.append(line.split()[1])
    return servers

def parse_hosts():
    entries = []
    for line in Path("/etc/hosts").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) >= 2:
            entries.append({"ip": parts[0], "names": parts[1:]})
    return entries

def main():
    now = datetime.now().isoformat()
    devs = parse_dev()
    routes = parse_route()
    arp = parse_arp()
    tcp_conns = parse_tcp_udp("/proc/net/tcp", "tcp")
    udp_conns = parse_tcp_udp("/proc/net/udp", "udp")
    snmp = parse_snmp()
    sockstat = parse_sockstat()
    dns = parse_resolv()
    hosts = parse_hosts()

    # Analyze
    listening = [c for c in tcp_conns if c["state"] == "LISTEN"]
    established = [c for c in tcp_conns if c["state"] == "ESTABLISHED"]
    time_wait = [c for c in tcp_conns if c["state"] == "TIME_WAIT"]
    close_wait = [c for c in tcp_conns if c["state"] == "CLOSE_WAIT"]

    active_iface = [d for d in devs if d["rx_packets"] > 0 or d["tx_packets"] > 0]
    issues = []

    for d in devs:
        if d["rx_errs"] > 0 or d["tx_errs"] > 0:
            issues.append(f"Interface {d['iface']} has {d['rx_errs']} RX errors and {d['tx_errs']} TX errors")
        if d["rx_drop"] > 0 or d["tx_drop"] > 0:
            issues.append(f"Interface {d['iface']} has {d['rx_drop']} RX drops and {d['tx_drop']} TX drops")

    tcp_retrans = int(snmp.get("tcp", {}).get("RetransSegs", 0))
    tcp_estab = int(snmp.get("tcp", {}).get("CurrEstab", 0))
    tcp_attempt_fails = int(snmp.get("tcp", {}).get("AttemptFails", 0))
    udp_inerrors = int(snmp.get("udp", {}).get("InErrors", 0))
    icmp_inerrors = int(snmp.get("icmp", {}).get("InErrors", 0))

    if tcp_retrans > 1_000_000:
        issues.append(f"High TCP retransmissions: {tcp_retrans:,} — possible congestion or packet loss")
    if tcp_attempt_fails > 10_000:
        issues.append(f"High TCP connection attempt failures: {tcp_attempt_fails:,}")
    if udp_inerrors > 0:
        issues.append(f"UDP input errors: {udp_inerrors}")
    if icmp_inerrors > 1000:
        issues.append(f"High ICMP errors: {icmp_inerrors:,}")

    # Identify external services from established connections
    ext_services = {}
    for c in established:
        ip = c["remote"].split(":")[0]
        port = int(c["remote"].split(":")[1])
        if ip.startswith("127.") or ip.startswith("192.168.") or ip.startswith("172.17.") or ip.startswith("100."):
            continue
        svc = "unknown"
        if port == 443:
            svc = "HTTPS"
        elif port == 80:
            svc = "HTTP"
        elif port == 22:
            svc = "SSH"
        elif port == 53:
            svc = "DNS"
        ext_services.setdefault(svc, []).append(ip)

    report_path = Path("artifacts/network-audit.md")
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with open(report_path, "w") as f:
        f.write(f"# Network Audit Report\n\n")
        f.write(f"**Generated**: {now}\n\n")

        f.write("## Interfaces\n\n")
        f.write("| Interface | RX Bytes | RX Packets | RX Errs | RX Drops | TX Bytes | TX Packets | TX Errs | TX Drops |\n")
        f.write("|---|---|---|---|---|---|---|---|---|\n")
        for d in devs:
            f.write(f"| {d['iface']} | {d['rx_bytes']:,} | {d['rx_packets']:,} | {d['rx_errs']} | {d['rx_drop']} | {d['tx_bytes']:,} | {d['tx_packets']:,} | {d['tx_errs']} | {d['tx_drop']} |\n")
        f.write("\n")

        f.write("## Routing Table\n\n")
        f.write("| Interface | Destination | Gateway | Mask |\n")
        f.write("|---|---|---|---|\n")
        for r in routes:
            f.write(f"| {r['iface']} | {r['dest']} | {r['gateway']} | {r['mask']} |\n")
        f.write("\n")

        f.write("## ARP Table\n\n")
        f.write("| IP | MAC | Flags | Device |\n")
        f.write("|---|---|---|---|\n")
        for a in arp:
            f.write(f"| {a['ip']} | {a['mac']} | {a['flags']} | {a['dev']} |\n")
        f.write("\n")

        f.write("## DNS Configuration\n\n")
        f.write(f"**Nameservers**: {', '.join(dns) if dns else 'None configured'}\n\n")

        f.write("## Local Hosts\n\n")
        f.write("| IP | Names |\n")
        f.write("|---|---|\n")
        for h in hosts:
            f.write(f"| {h['ip']} | {', '.join(h['names'])} |\n")
        f.write("\n")

        f.write("## TCP Connections\n\n")
        f.write(f"- **LISTEN**: {len(listening)}\n")
        f.write(f"- **ESTABLISHED**: {len(established)}\n")
        f.write(f"- **TIME_WAIT**: {len(time_wait)}\n")
        f.write(f"- **CLOSE_WAIT**: {len(close_wait)}\n")
        f.write(f"- **Total entries**: {len(tcp_conns)}\n\n")

        f.write("### Listening Ports (TCP)\n\n")
        f.write("| Local Address | State |\n")
        f.write("|---|---|\n")
        for c in listening:
            f.write(f"| {c['local']} | {c['state']} |\n")
        f.write("\n")

        f.write("### External Services (ESTABLISHED)\n\n")
        for svc, ips in ext_services.items():
            unique = sorted(set(ips))
            f.write(f"- **{svc}**: {len(unique)} unique peer(s) — {', '.join(unique[:5])}{'...' if len(unique) > 5 else ''}\n")
        f.write("\n")

        f.write("## UDP Endpoints\n\n")
        f.write(f"- **Total entries**: {len(udp_conns)}\n\n")

        f.write("## Socket Statistics\n\n")
        for k, v in sockstat.items():
            f.write(f"- **{k}**: {v}\n")
        f.write("\n")

        f.write("## IP / TCP / UDP / ICMP Statistics\n\n")
        for proto, vals in snmp.items():
            f.write(f"### {proto.upper()}\n\n")
            for k, v in vals.items():
                f.write(f"- {k}: {v}\n")
            f.write("\n")

        f.write("## Anomalies & Warnings\n\n")
        if issues:
            for issue in issues:
                f.write(f"- ⚠️ {issue}\n")
        else:
            f.write("- ✅ No anomalies detected\n")
        f.write("\n")

        f.write("## Summary\n\n")
        f.write(f"- Active interfaces: {len(active_iface)}\n")
        f.write(f"- Total TCP connections tracked: {len(tcp_conns)}\n")
        f.write(f"- Established outbound connections: {len(established)}\n")
        f.write(f"- TCP retransmissions (lifetime): {tcp_retrans:,}\n")
        f.write(f"- UDP input errors: {udp_inerrors}\n")
        f.write(f"- ICMP errors: {icmp_inerrors:,}\n")
        f.write(f"- ARP entries: {len(arp)}\n")
        f.write("\n")

    print(f"Report written to {report_path.resolve()}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
