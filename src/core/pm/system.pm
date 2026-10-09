// ObsidianOS system memory map (PM v0.1).
//
// This file DESCRIBES the OS memory geometry. It is assembled to
// system.pmem and embedded into the virtual disk defaults. At boot,
// the kernel reads geometry (block_size) FROM THE FILE — no file,
// no boot. Edit here (then reassemble) to change OS memory geometry.

memory obsidian_sys {
  block_size 32768

  table sysmap {
    block hdr {
      perm r
      os_name: "ObsidianOS"
      pm_spec: 1
      mailbox_blocks: 1
      max_spaces: 256
    }

    block boot {
      perm rw
      boot_flags: 0
      last_boot: 0
    }
  }
}
