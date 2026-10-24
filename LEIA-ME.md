# Site ASADEPEIXE

Site estático: não precisa de instalação nem de build. Tudo o que o site usa está nesta pasta.

## Editar conteúdo
- **Contatos e mensagens do WhatsApp:** `js/data.js`
- **Portfólio:** as imagens saem da pasta `SITE ASA`. Em cada cliente, se existir a pasta `SUBIR`, só ela é usada; senão, todas as imagens da pasta do cliente. Para regerar (ex.: depois de incluir um cliente novo), na pasta `ferramentas` rode uma vez `npm install` e depois `npm run portfolio` — as versões leves vão para `assets/portfolio/<cliente>/01.jpg, 02.jpg…` sem tocar nos originais. Apresentações em PDF: deixe o PDF na raiz de `SITE ASA` (ou na pasta do cliente) e rode `py -m pip install pymupdf` uma vez e depois `py ferramentas/pdf-para-jpg.py` — cada página vira JPEG em `SITE ASA/<CLIENTE>/SUBIR`. Em seguida ajuste a lista `PORTFOLIO` em `js/data.js`: nome, quais páginas aparecem na galeria (`images` — só 3 versões da marca, mockups e aplicações) e qual é a capa (`cover`). O mosaico se monta sozinho para qualquer quantidade de projetos, em módulos de 7 (grande, quadrados, alto e largo) — a ordem da lista define o formato de cada capa.
- **Portfólio de sites:** lista `SITES` em `js/data.js` (nome e endereço). A imagem de cada um fica em `assets/sites/<slug>.jpg` — uma captura comprida da página inicial; na vitrine ela rola ao passar o mouse. Para atualizar uma captura, troque o arquivo pelo mesmo nome.
- **Textos:** `index.html`

## Ver no computador
```
npx http-server site -p 5173
```
Depois abra http://localhost:5173 (precisa de servidor; abrir o arquivo direto com duplo clique não carrega o 3D).

## Publicar na GoDaddy
**Com plano de hospedagem (cPanel):** cPanel → Gerenciador de Arquivos → `public_html` → envie todo o conteúdo desta pasta (`index.html`, `css/`, `js/`, `vendor/`, `assets/`). As pastas `docs/` e este arquivo são opcionais.

**Só com o domínio:** publique a pasta grátis na Netlify ou Vercel (arrastar e soltar) e aponte o DNS do `asadepeixe.com` na GoDaddy para lá. Não mexa nos registros MX, para o e-mail continuar funcionando.
