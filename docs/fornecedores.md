# Regras de Negócio e Políticas de Fornecedores — Munaya

Este documento centraliza as diretrizes operacionais, fluxos de pós-venda, SLAs e políticas de trocas/devoluções acordadas com os fornecedores e parceiros de produção (Print-on-Demand, confecção e logística) da Munaya.

---

## 1. Princípios Gerais e Responsabilidade Operacional

No modelo de negócios com fornecedores terceirizados de produção/fulfillment (ex: Print-on-Demand):

1. **Responsabilidade Legal perante o Consumidor (CDC):**
   - A **Munaya** é a detentora da relação comercial com o cliente final perante o Código de Defesa do Consumidor (Lei nº 8.078/1990).
   - O fornecedor responde diretamente à Munaya de acordo com os termos de serviço e SLA contratual entre pessoas jurídicas (B2B).

2. **Divisão de Responsabilidades:**
   - **Falhas de Produção / Qualidade / Avarias:** Devem ser acionadas e cobertas pelo fornecedor responsável pela confecção/estampagem.
   - **Arrependimento / Escolha Incorreta de Tamanho / Cor:** A Munaya absorve a operação e os custos perante o consumidor final, salvo negociação comercial específica com o parceiro.

---

## 2. Matriz de Fornecedores

---

### 2.1. Dimona (Print-on-Demand / Camiseteria)

- **Tipo de Parceria:** Produção sob demanda (Print-on-Demand / Dropshipping)
- **Produtos:** Camisetas, vestuário estampado e itens têxteis personalizados.

#### A. Requisitos de Produção da Esteira: O que a Dimona precisa saber para produzir?

Quando a Munaya fecha uma venda e dispara a ordem para a Dimona via integração de API (`src/lib/dimona.ts`), a esteira fabril deles precisa de **3 respostas essenciais**:

1. **Qual é o Blank (a camiseta crua)?**
   - **Tipo de malha:** (ex: Classic 30.1, Quality, ou Estonada Rockwear).
   - **Cor do tecido:** Preta, Branca ou Cinza.
   - **Tamanho:** PP, P, M, G, GG ou XGG.
   *(Essas informações são compiladas diretamente no código do SKU e nos atributos do item do pedido).*

2. **Qual é a Arte para estampar?**
   - **Arquivo em alta definição:** Formato PNG em 300 DPI, com fundo transparente, que nós já deixamos preparado e mapeado no campo `artwork_url` de cada produto no Supabase (e no utilitário `src/lib/artworks.ts`).
   - **Posição de estampa:** Frente (formato A3/A4) ou Costas.
   *(Transmitido no array `designs` do payload da API).*

3. **Qual é o Mockup de conferência?**
   - **Imagem da camiseta pronta:** Visualização final para o operador da fábrica bater o olho e conferir se a estampa não ficou invertida, torta ou fora de escala em relação à gola.
   *(Transmitido no array `mocks` do payload da API).*

| Parâmetro Dimona | Campo no Sistema Munaya | Descrição / Requisito Técnico |
| :--- | :--- | :--- |
| **Blank (Peça crua)** | `sku`, `size`, `color` | Malha (Classic/Quality/Estonada), cor e grade de tamanho (PP ao XGG). |
| **Arte de Impressão** | `artwork_url` (designs) | PNG 300 DPI transparente de alta resolução, formato A3/A4. |
| **Mockup de Conferência** | `mock_url` (mocks) | Foto/render da camiseta pronta para conferência visual do operador. |

---

#### B. Produto com Defeito de Produção, Avaria ou Não Conformidade
| Item | Especificação |
| :--- | :--- |
| **Responsabilidade** | **Dimona** (assume integralmente a reposição/troca). |
| **Prazo para Abertura** | Em até **7 (sete) dias corridos** após o recebimento pelo cliente final. |
| **Requisitos Obrigatórios** | - Número do pedido (ID interno Munaya e ID do pedido na plataforma Dimona).<br>- Descrição detalhada do defeito ou divergência.<br>- Fotos nítidas ou medidas com fita métrica que comprovem a falha/defeito. |
| **Canal de Contato** | E-mail do suporte B2B / atendimento ao parceiro Dimona. |
| **Logística Reversa** | Sendo identificado e aprovado o erro de fabricação/qualidade, a Dimona emite e fornece o código de logística reversa para envio da peça defeituosa e procede com a reexecução/troca sem custos. |

#### C. Troca por Tamanho, Cor ou Arrependimento de Compra
| Item | Especificação |
| :--- | :--- |
| **Responsabilidade** | **Munaya** (a Dimona **não** aceita trocas ou devoluções por escolha de tamanho incorreto ou desistência). |
| **Enquadramento Legal** | Artigo 49 do CDC (Direito de Arrependimento em até 7 dias da entrega em compras virtuais). |
| **Impacto Financeiro** | A Munaya precisa **absorver o custo integral de um novo pedido** na plataforma do fornecedor caso seja gerada uma nova peça para o cliente. |
| **Gestão Logística** | A Munaya é responsável por gerar a etiqueta de logística reversa diretamente com os Correios/transportadora e receber a peça indesejada em endereço próprio. |
| **Destinação da Peça Recebida** | - Incorporar ao estoque próprio para pronta entrega;<br>- Venda em campanhas promocionais / bazar;<br>- Descarte ou doação conforme política interna de sustentabilidade. |

#### D. Fluxograma de Atendimento — Dimona

```
Cliente solicita suporte pós-recebimento
                   │
                   ├──> [Defeito de Fabricação / Avaria]
                   │         │
                   │         ├── Coletar fotos, medidas e número do pedido
                   │         ├── Abrir chamado com a Dimona em até 7 dias
                   │         └── Dimona aprova -> Fornece logística reversa -> Repõe sem custo
                   │
                   └──> [Arrependimento / Troca de Tamanho]
                             │
                             ├── Munaya atende o cliente (CDC Art. 49)
                             ├── Munaya gera logística reversa para retorno da peça à sede/estoque próprio
                             └── Munaya custeia novo pedido na Dimona (se for troca) ou reembolsa cliente
```

---

## 3. Template para Cadastro de Novos Fornecedores

Ao integrar um novo fornecedor ao catálogo da Munaya, preencher a estrutura abaixo para documentar os termos operacionais:

```markdown
### [Nome do Fornecedor]
- **Tipo de Operação:** (Ex: Pronta entrega, Dropshipping nacional, Print-on-Demand, Confecção sob lote)
- **Linha de Produtos:** (Ex: Bonés, moletons, canecas, embalagens)
- **SLA de Produção / Envio:** (Ex: X dias úteis para despachar)

#### Política de Defeitos e Avarias:
- **Prazo para notificação:**
- **Documentos/evidências exigidas:**
- **Custos de frete/reposição:**

#### Política de Arrependimento / Trocas Comerciais:
- **Regra do fornecedor:**
- **Ações necessárias da Munaya:**
```
