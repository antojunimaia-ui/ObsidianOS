# MISSION — ObsidianOS

> **A missão do ObsidianOS é depender cada vez menos de JavaScript e TypeScript,
> e cada vez mais de si mesmo para se manter.**

## O que isso significa

Toda capacidade do sistema deve, ao longo do tempo, migrar de código da
plataforma hospedeira (JS/TS embutido no bundle) para **artefatos do próprio
OS**: binários `.obx`, scripts `.osl`, registro e disco
virtual. O kernel em TS é o bootstrap — não o destino.

## A regra

Ao implementar qualquer coisa, pergunte, nesta ordem:

1. Dá para viver **dentro do OS** (`.obx`, `.osl`, `.pmem`, registro, VFS)?
2. Só se não der: vive no kernel TS como ponte fina e temporária?
3. Nunca: lógica do OS presa em componente React, store ou util fora do sistema.

## Não se desvie

- Não reintroduza simulação onde já existe medição.
- Não crie atalho JS/TS para o que um artefato do OS resolve.
- Todo PR que aumenta a dependência do hospedeiro deve justificar por que
  não coube dentro do sistema — ou não entra.
