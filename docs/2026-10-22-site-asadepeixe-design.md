# Site ASADEPEIXE — design

> **v3 (atual):** base clean da v2 + momentos de impacto, a partir de referências do Awwwards (Instrument, Signal-A, Locomotive, Dokmeh, Dogstudio).
> Display **Archivo** (largo/pesado, mistura de pesos 300 e 700–900), texto **Geist**, rótulos **Geist Mono** no formato "(01) Seção".
> Hero: palavra-marca ASADEPEIXE ocupando toda a largura + palco escuro com o cardume 3D. Serviços em linhas que expandem.
> Números em bloco escuro. Portfólio com rolagem horizontal fixa (desktop). CTA laranja com letreiro. Rodapé com a marca gigante.
> As seções abaixo descrevem a v2 e ficam como histórico.

## v2 (clean)

## Objetivo
Gerar contatos via WhatsApp para três serviços: Marca & Identidade Visual, Gestão de Tráfego e Sites.
Público: donos de pequenos e médios negócios em Goiânia/Região Metropolitana e no Brasil (atendimento por call).

## Decisões
- **Stack:** site estático (HTML/CSS/JS, sem build). Three.js, GSAP + ScrollTrigger e Lenis copiados em `vendor/`.
- **Contato:** somente WhatsApp (5562986002205), com mensagem pré-preenchida por serviço.
- **Dados de mercado:** apenas números com fonte citada no próprio site.
- **v2 (pedido do cliente):** visual mais clean e moderno, fontes sem serifa, tipografia menor e diagramação em grade.

## Sistema visual
| Token | Hex | Uso |
|---|---|---|
| ink | `#0E1525` | texto |
| ink-2 | `#4A5468` | texto secundário |
| paper / mist | `#FFFFFF` / `#F4F6F9` | fundos alternados |
| abismo | `#0B1630` | card do cardume, card de destaque, CTA |
| asa | `#E3701F` | laranja da marca: botões, acentos |

Tipografia: **Geist** (títulos e texto) · **Geist Mono** (rótulos e fontes). Conteúdo limitado a 1200px.

**Assinatura:** cardume 3D de peixes-voadores dentro de um card escuro no topo, seguindo o mouse; clique espalha.
Microinterações: cards de serviço com inclinação 3D, botões principais levemente magnéticos, revelações suaves e contadores.

## Seções
1. Hero em duas colunas (texto + card 3D)
2. Serviços — 3 cards (Tráfego em destaque)
3. Por que investir no digital — 4 dados com fonte
4. Por que ASADEPEIXE — conceito do peixe-voador
5. Portfólio — grade de 6 projetos + "Ver mais", modal com galeria
6. Como trabalhamos — 4 etapas em linha do tempo
7. CTA final
8. Rodapé

## Conteúdo pendente (com o cliente)
- Arquivo do logo (SVG/PNG) em `assets/`
- Imagens do portfólio em `assets/portfolio/<cliente>/` e confirmação dos clientes/segmentos em `js/data.js`
