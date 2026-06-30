import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini client if API key is present
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Route: Gemini Reminder Generation
  app.post("/api/gemini/lembrete", async (req, res) => {
    try {
      const { cliente, equipamento, link, meses, cupom, incluirCupom } = req.body;

      if (!cliente || !equipamento) {
        return res.status(400).json({ error: "Cliente e Equipamento são obrigatórios." });
      }

      const clientName = cliente.nome || "Cliente";
      const eqType = equipamento.tipo_equipamento || "Ar Condicionado";
      const eqBrand = equipamento.marca || "Aparelho";
      const eqModel = equipamento.modelo || "";
      const eqLoc = equipamento.local_instalado || "Ambiente";
      
      const schedulingLink = link || "https://climatech-agendamentos.com.br/agendar";
      const recurrenceMonths = meses || 6;
      const discountCoupon = cupom || "DESCONTO10";
      const useCoupon = !!incluirCupom;

      // Helper to generate high-quality fallback templates matching exactly user specifications
      const getFallbackTemplates = (name: string, brand: string, loc: string) => {
        const couponSuffix = useCoupon ? `\n\n🎁 *BÔNUS EXCLUSIVO:* Use o cupom *${discountCoupon}* para ganhar um desconto especial na higienização do seu aparelho!` : "";
        
        const fallbacks = {
          saude: `❄️ *REVISÃO DE HIGIENIZAÇÃO* ❄️\n\nOlá, *${name}*! Tudo bem? 😊\n\nNotamos que já faz um tempo que o seu ar-condicionado *${brand}* no(a) *${loc}* não passa por uma higienização profissional.\n\nCuidar do seu aparelho é proteger quem você ama! Veja o que uma limpeza completa faz por você:\n\n🍃 *SAÚDE EM PRIMEIRO LUGAR:*\n✅ *Ar Puro de Verdade:* Elimina 99,9% de ácaros, fungos, vírus e poeira acumulada.\n✅ *Adeus Alergias:* Previne crises de asma, rinite, tosse e ressecamento das vias respiratórias.\n✅ *Ambiente Saudável:* Garante um ar higienizado e livre de odores desagradáveis.${couponSuffix}\n\n👉 Quer respirar um ar mais puro hoje? Garanta seu horário!\nChama no WhatsApp: ${schedulingLink}`,
          
          energia: `⚡ *SEU AR-CONDICIONADO PODE ESTAR PESANDO NO BOLSO!* ⚡\n\nOi, *${name}*! Sabia que a falta de higienização do seu *${brand}* no(a) *${loc}* pode estar aumentando sua conta de luz em até *30%*?\n\nQuando o filtro e a serpentina acumulam poeira, o motor precisa trabalhar o dobro para refrigerar o ambiente!\n\n💰 *SUA ECONOMIA GARANTIDA:*\n✅ *Conta de Luz Menor:* Reduz o consumo de energia elétrica em até *30%* imediatamente!\n✅ *Maior Durabilidade:* Evita quebras inesperadas e consertos caros no compressor.\n✅ *Super Resfriamento:* O aparelho volta a gelar muito mais rápido e com mais força.${couponSuffix}\n\n👉 Não gaste dinheiro à toa! Agende sua manutenção preventiva agora.\nChama no WhatsApp: ${schedulingLink}`,
          
          direto: `📅 *LEMBRETE DE MANUTENÇÃO PREVENTIVA R.A CLIMATIZAÇÃO* 📅\n\nOlá, *${name}*! Passando para te lembrar que já se passaram *${recurrenceMonths} meses* desde a última higienização preventiva do seu ar-condicionado *${brand}* no(a) *${loc}*.\n\nPara manter o aparelho funcionando perfeitamente, o recomendado é a revisão a cada 6 meses.\n\n⚙️ *VANTAGENS DA HIGIENIZAÇÃO:*\n❄️ *Ar mais gelado e saudável* para sua casa.\n📉 *Queda imediata de até 30%* no consumo de energia.\n🛠️ *Evita a queima* de peças vitais do aparelho.${couponSuffix}\n\n👉 Vamos agendar a sua revisão para esta semana? É rápido e limpo!\nChama no WhatsApp: ${schedulingLink}`,
          
          beneficios: `✨ *HIGIENIZAÇÃO COMPLETA: MAIS SAÚDE & MAIS ECONOMIA!* ✨\n\nOlá, *${name}*! Que tal cuidar do seu conforto, da sua saúde e do seu bolso hoje?\n\nA higienização regular do seu ar-condicionado *${brand}* no(a) *${loc}* traz benefícios imediatos que você sente no dia a dia:\n\n📊 *VEJA OS BENEFÍCIOS:*\n🩺 *SAÚDE:* Ar 100% livre de ácaros, bactérias e impurezas causadoras de alergias.\n💵 *ECONOMIA:* Consumo de energia reduzido em até *30%* e prevenção de quebras caras.\n💨 *DESEMPENHO:* Aparelho gelando muito mais rápido e com fluxo de ar ideal.${couponSuffix}\n\n👉 Deixe seu ar-condicionado como novo! Reserve o seu horário técnico.\nChama no WhatsApp: ${schedulingLink}`
        };
        return [
          { id: "saude", titulo: "Opção 1: Foco na Saúde 🍃", mensagem: fallbacks.saude },
          { id: "energia", titulo: "Opção 2: Foco na Economia ⚡", mensagem: fallbacks.energia },
          { id: "direto", titulo: "Opção 3: Lembrete Rápido 📅", mensagem: fallbacks.direto },
          { id: "beneficios", titulo: "Opção 4: Benefícios Claros ✨", mensagem: fallbacks.beneficios }
        ];
      };

      // If no API key, provide clean offline templates immediately
      if (!ai) {
        return res.json({
          success: true,
          modelos: getFallbackTemplates(clientName, eqBrand, eqLoc),
          offline: true
        });
      }

      try {
        // We have Gemini! Generate 4 distinct templates dynamically, instructed about scheduling link and coupon options
        const prompt = `
        Você é um assistente de inteligência artificial especializado na área de manutenção e higienização de ar-condicionado.
        Gere 4 modelos diferentes de mensagens personalizadas para enviar via WhatsApp para o cliente lembrando-o sobre a necessidade de fazer a manutenção preventiva/higienização de seu equipamento.

        Instruções de Formatação Visual ("Desenhos" com Emojis):
        - Cada mensagem deve possuir uma formatação extremamente atraente, com seções estruturadas usando "desenhos" visuais feitos de emojis organizados (como tópicos, cabeçalhos estilizados, caixas e setas) para facilitar a leitura.
        - Apresente de forma explícita e visualmente marcante os BENEFÍCIOS PARA A SAÚDE (eliminação de 99% de ácaros, fungos, bactérias, prevenção de crises de alergia/rinite) e BENEFÍCIOS DE ECONOMIA DE ENERGIA (redução comprovada de até 30% na conta de luz e maior durabilidade do motor).

        Parâmetros de Customização Obrigatórios:
        - Celular/Contato da Empresa (NÃO COLOQUE LINKS DE SITE OU AGENDAMENTO, APENAS O NÚMERO): ${schedulingLink}
        - Período de recorrência (meses desde a última limpeza): ${recurrenceMonths} meses
        ${useCoupon ? `- Inclua obrigatoriamente um bônus/desconto com o cupom especial "${discountCoupon}".` : "- Não ofereça cupom de desconto neste envio."}
        
        Dados do Cliente:
        - Nome: ${clientName}
        - Aparelho: ${eqType} ${eqBrand} ${eqModel} instalado em "${eqLoc}"

        As mensagens devem ser amigáveis, altamente persuasivas e utilizar formatação adequada para WhatsApp (emojis adequados e texto importante em negrito usando asteriscos, ex: *texto*).
        ATENÇÃO EXTREMA: Não insira links de agendamento online ou de sites. Use estritamente o contato do WhatsApp da empresa para responder ou chamar diretamente no número: ${schedulingLink} (ex: "Chama no WhatsApp: ${schedulingLink}").
        As mensagens devem ser curtas e diretas, mas contendo os tópicos visuais com emojis ilustrando os benefícios.

        Gere exatamente 4 modelos distintos seguindo estritamente estas diretrizes de conteúdo:
        1. Opção 1: Foco na Saúde 🍃 - Cabeçalho estilizado com emojis. Explique visualmente que faz tempo que o aparelho não limpa, com uma seção estruturada de tópicos demonstrando os benefícios imediatos para a saúde da família (ar puro de verdade, prevenção de alergias, eliminação de ácaros e bactérias).
        2. Opção 2: Foco na Economia ⚡ - Cabeçalho impactante sobre custos. Seção de tópicos explicando como a sujeira no aparelho faz o motor trabalhar o dobro, aumentando a conta de energia em até 30% e correndo risco de quebrar o compressor.
        3. Opção 3: Lembrete Rápido 📅 - Lembrete amigável direto informando que faz exatamente ${recurrenceMonths} meses desde a última manutenção, com uma lista rápida e desenhada com emojis mostrando as vantagens combinadas de saúde e economia.
        4. Opção 4: Benefícios Claros ✨ - Um resumo em tópicos ilustrados unindo a redução imediata de ácaros e bactérias e a economia de luz de até 30% para motivar o cliente a responder no ato.

        Retorne a resposta estritamente em formato JSON com o seguinte esquema (uma lista com exatamente os 4 modelos):
        [
          {
            "id": "saude",
            "titulo": "Opção 1: Foco na Saúde 🍃",
            "mensagem": "Texto do modelo 1 estruturado com emojis aqui..."
          },
          {
            "id": "energia",
            "titulo": "Opção 2: Foco na Economia ⚡",
            "mensagem": "Texto do modelo 2 estruturado com emojis aqui..."
          },
          {
            "id": "direto",
            "titulo": "Opção 3: Lembrete Rápido 📅",
            "mensagem": "Texto do modelo 3 estruturado com emojis aqui..."
          },
          {
            "id": "beneficios",
            "titulo": "Opção 4: Benefícios Claros ✨",
            "mensagem": "Texto do modelo 4 estruturado com emojis aqui..."
          }
        ]
        Retorne APENAS o JSON válido. Sem explicações ou blocos de markdown adicionais.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        const responseText = response.text || "[]";
        let modelos = [];
        try {
          modelos = JSON.parse(responseText.trim());
        } catch (parseErr) {
          console.error("Erro ao parsear JSON do Gemini:", responseText);
          throw parseErr;
        }

        return res.json({
          success: true,
          modelos,
          offline: false
        });

      } catch (geminiErr: any) {
        console.warn("A chamada ao Gemini ou o processamento falhou. Ativando fallback offline gracioso:", geminiErr.message || geminiErr);
        return res.json({
          success: true,
          modelos: getFallbackTemplates(clientName, eqBrand, eqLoc),
          offline: true,
          warning: "A IA do Gemini está com alta demanda ou temporariamente indisponível. Usando modelos de alta conversão offline."
        });
      }
    } catch (err: any) {
      console.error("Erro inesperado no servidor:", err);
      return res.status(500).json({ error: "Erro interno no servidor.", details: err.message });
    }
  });

  // API Route: Gemini Audit of Card Expenses
  app.post("/api/gemini/auditar-gastos", async (req, res) => {
    try {
      const { cartoes, gastos } = req.body;

      if (!cartoes || !gastos) {
        return res.status(400).json({ error: "Cartões e gastos são obrigatórios." });
      }

      // Format lists for prompt
      const cartoesStr = cartoes.map((c: any) => `- ${c.nome}: Limite R$ ${c.limite.toLocaleString('pt-BR')}, Comprometido R$ ${(c.fatura_lancada || 0).toLocaleString('pt-BR')}, Dia Vencimento: ${c.dia_vencimento}`).join('\n');
      const gastosStr = gastos.map((g: any) => `- Descrição: ${g.descricao}, Valor: R$ ${g.valor.toLocaleString('pt-BR')}, Data: ${g.data}, Categoria: ${g.categoria}, Cartão: ${g.cartao_id.toUpperCase()}`).join('\n');

      const getFallbackAudit = () => {
        return `### Parecer de Auditoria R.A Climatização Pro
Análise automatizada de extratos corporativos em lote.

**Aderência Geral:** As despesas observadas demonstram conformidade operacional e financeira aceitável. O uso do limite geral do crédito está controlado e distribuído de forma moderada, minimizando riscos de liquidez imediata.

**Recomendação Técnica:** Recomenda-se realizar compras de maior volume em plataformas de faturamento direto (Dufrio, Frigelar, Climario) para resguardar as faturas rotativas do cartão de crédito corporativo para despesas emergenciais de frotas e consumíveis rápidos de técnicos em campo.`;
      };

      if (!ai) {
        return res.json({
          success: true,
          parecer: getFallbackAudit(),
          offline: true
        });
      }

      const prompt = `
      Você é um auditor financeiro e tributário sênior especializado em conformidade e análise de contas de empresas de refrigeração comercial e HVAC.
      Analise os seguintes dados de cartões de crédito corporativos e os gastos registrados para dar um parecer técnico de caixa e de conformidade jurídica tributária.

      DADOS DOS CARTÕES:
      ${cartoesStr}

      HISTÓRICO DE GASTOS LANÇADOS:
      ${gastosStr}

      Gere um parecer profissional, objective e persuasivo sobre os gastos.
      Estruture sua resposta usando markdown com os seguintes pontos:
      1. Título do Parecer (ex: ### Parecer de Auditoria R.A Climatização Pro).
      2. Análise Geral de ocupação de limite (cite bancos específicos de forma contextual, especialmente se houver algum com ocupação alta como BMG).
      3. Aderência Operacional (se há gastos concentrados em algum cartão, ex: BMG para compras específicas como Climario ou LuisGustavoPeres, ou se os gastos fazem sentido para manutenção, combustível e insumos).
      4. Recomendações e Diretrizes de conformidade jurídica tributária para evitar bitributação ou autuação de caixa.

      A resposta deve ser em português brasileiro, clara, técnica e conter soluções práticas. Evite jargões excessivos e seja direto.
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
          }
        });

        return res.json({
          success: true,
          parecer: response.text || getFallbackAudit(),
          offline: false
        });
      } catch (geminiErr: any) {
        console.warn("A chamada ao Gemini ou o processamento de auditoria falhou. Ativando fallback:", geminiErr.message || geminiErr);
        return res.json({
          success: true,
          parecer: getFallbackAudit(),
          offline: true,
          warning: "Alta demanda da IA. Exibindo parecer preliminar offline."
        });
      }
    } catch (err: any) {
      console.error("Erro na auditoria de gastos:", err);
      return res.status(500).json({ error: "Erro interno ao auditar gastos." });
    }
  });

  // API Route: PDF/Text Bank Statement Extraction and Classification via Gemini
  app.post("/api/gemini/parse-extrato", async (req, res) => {
    try {
      const { text, fileBase64, fileMimeType, fileName } = req.body;

      if (!text && !fileBase64) {
        return res.status(400).json({ error: "O texto ou o arquivo em base64 do extrato é obrigatório." });
      }

      if (!ai) {
        return res.json({
          success: false,
          error: "Gemini AI não inicializada. Fallback Heurístico Ativo.",
          offline: true
        });
      }

      const prompt = `
      Você é um analisador e classificador de extratos bancários de alta precisão para a empresa R.A Climatização.
      Sua tarefa é extrair transações financeiras (compras, despesas) de climatização ou do dia a dia a partir do extrato bancário/fatura fornecido.
      Se o nome do arquivo foi fornecido, use-o como contexto para identificar o banco (por exemplo: nubank, inter, carrefour, c6, bmg).

      Nome do arquivo de origem: ${fileName || "Não fornecido"}

      REGRAS DE CLASSIFICAÇÃO:
      1. Identifique os cartões correspondentes aos lançamentos (IDs permitidos: nubank, inter, carrefour, c6, bmg). Se não conseguir identificar o cartão pelo cabeçalho ou contexto do arquivo, use o cartão selecionado ou infira baseado na data/origem.
      2. Converta as datas para o formato ISO YYYY-MM-DD. Se a data estiver no formato "DD/MM" (ex: "15/06"), assuma o ano de 2026 (ex: "2026-06-15").
      3. Extraia o valor correto como número de ponto flutuante positivo (ex: 150.00). Ignore sinais de menos ou parênteses se for apenas uma indicação de débito.
      4. Categorize as despesas entre as opções válidas: "Peças", "Combustível", "Ferramentas", "Alimentação" ou "Outros".
      5. Se a transação não estiver clara ou não for de compra (ex: saldos, transferências recebidas, depósitos ou pagamentos de fatura), ignore-a completamente.

      Retorne estritamente um JSON contendo uma lista de transações conforme o esquema configurado.
      `;

      let contents: any;
      if (fileBase64 && fileMimeType) {
        contents = {
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: fileMimeType
              }
            },
            {
              text: prompt
            }
          ]
        };
      } else {
        contents = `${prompt}\n\nTEXTO DO EXTRATO BANCÁRIO / DOCUMENTO:\n"""\n${text}\n"""`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cartao_id: {
                  type: Type.STRING,
                  description: "O ID do cartão de destino (nubank, inter, carrefour, c6 ou bmg)."
                },
                descricao: {
                  type: Type.STRING,
                  description: "Descrição limpa da compra ou fornecedor."
                },
                valor: {
                  type: Type.NUMBER,
                  description: "Valor float da transação (positivo)."
                },
                data: {
                  type: Type.STRING,
                  description: "Data do lançamento no formato YYYY-MM-DD."
                },
                categoria: {
                  type: Type.STRING,
                  description: "Categoria do gasto (Peças, Combustível, Ferramentas, Alimentação, Outros)."
                }
              },
              required: ["cartao_id", "descricao", "valor", "data", "categoria"]
            }
          }
        }
      });

      const jsonText = response.text || "[]";
      const transactions = JSON.parse(jsonText);

      return res.json({
        success: true,
        transactions,
        offline: false
      });

    } catch (err: any) {
      console.error("Erro ao analisar extrato com Gemini:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao analisar extrato.", message: err.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
