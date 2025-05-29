# Sistema de Controle Financeiro MEI

Um sistema completo para controle financeiro de MEI (Microempreendedor Individual) com funcionalidades de:

- 📊 Dashboard financeiro
- 💰 Controle de receitas e gastos
- 💳 Gerenciamento de cartões de crédito
- 🏦 Sistema de reservas/poupança
- 📈 Histórico mensal
- 🎯 Metas de reserva
- 📱 Interface responsiva

## 🚀 Configuração do Banco de Dados

### Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais do projeto (URL e API Key)

### Scripts SQL para Executar no Supabase

Execute os scripts abaixo **na ordem apresentada** no SQL Editor do Supabase:

#### 1. Tabelas Principais do Sistema

\`\`\`sql
-- ==================== TABELAS PRINCIPAIS ====================

-- Tabela de transações (receitas e gastos)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('receita', 'gasto')),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  is_fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações mensais (DAS, etc)
CREATE TABLE IF NOT EXISTS monthly_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  das_value DECIMAL(10,2) NOT NULL DEFAULT 67.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Tabela de valores extras recebidos
CREATE TABLE IF NOT EXISTS extra_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_extra_income_month_year ON extra_income(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_settings_month_year ON monthly_settings(month, year);

-- Inserir configuração padrão para o mês atual
INSERT INTO monthly_settings (month, year, das_value) 
VALUES (EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), 67.00)
ON CONFLICT (month, year) DO NOTHING;

SELECT 'Tabelas principais criadas com sucesso!' as status;
\`\`\`

#### 2. Sistema de Histórico Mensal

\`\`\`sql
-- ==================== SISTEMA DE HISTÓRICO ====================

-- Tabela de resumo mensal
CREATE TABLE IF NOT EXISTS monthly_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_receitas DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_gastos DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_extras DECIMAL(10,2) NOT NULL DEFAULT 0,
  das_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  ir_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Tabela de transações arquivadas
CREATE TABLE IF NOT EXISTS archived_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('receita', 'gasto')),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  is_fixed BOOLEAN DEFAULT FALSE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de valores extras arquivados
CREATE TABLE IF NOT EXISTS archived_extra_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para arquivar dados do mês
CREATE OR REPLACE FUNCTION archive_month_data(target_month INTEGER, target_year INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  total_receitas DECIMAL(10,2) := 0;
  total_gastos DECIMAL(10,2) := 0;
  total_extras DECIMAL(10,2) := 0;
  das_val DECIMAL(10,2) := 67;
  saldo_final DECIMAL(10,2) := 0;
  ir_mensal DECIMAL(10,2) := 0;
  receita_anual DECIMAL(10,2) := 0;
BEGIN
  -- Calcular totais
  SELECT COALESCE(SUM(amount), 0) INTO total_receitas
  FROM transactions 
  WHERE type = 'receita' 
    AND EXTRACT(MONTH FROM date) = target_month 
    AND EXTRACT(YEAR FROM date) = target_year;

  SELECT COALESCE(SUM(amount), 0) INTO total_gastos
  FROM transactions 
  WHERE type = 'gasto' 
    AND EXTRACT(MONTH FROM date) = target_month 
    AND EXTRACT(YEAR FROM date) = target_year;

  SELECT COALESCE(SUM(amount), 0) INTO total_extras
  FROM extra_income 
  WHERE month = target_month AND year = target_year;

  SELECT COALESCE(das_value, 67) INTO das_val
  FROM monthly_settings 
  WHERE month = target_month AND year = target_year;

  -- Calcular IR
  receita_anual := (total_receitas + total_extras) * 12;
  IF receita_anual > 28559.7 THEN
    ir_mensal := (receita_anual - 28559.7) * 0.075 / 12;
  END IF;

  saldo_final := total_receitas + total_extras - total_gastos - das_val;

  -- Inserir resumo mensal
  INSERT INTO monthly_summary (month, year, total_receitas, total_gastos, total_extras, das_value, saldo_mensal, ir_mensal)
  VALUES (target_month, target_year, total_receitas, total_gastos, total_extras, das_val, saldo_final, ir_mensal)
  ON CONFLICT (month, year) DO UPDATE SET
    total_receitas = EXCLUDED.total_receitas,
    total_gastos = EXCLUDED.total_gastos,
    total_extras = EXCLUDED.total_extras,
    das_value = EXCLUDED.das_value,
    saldo_mensal = EXCLUDED.saldo_mensal,
    ir_mensal = EXCLUDED.ir_mensal;

  -- Arquivar transações
  INSERT INTO archived_transactions (original_id, type, category, amount, date, description, is_fixed, month, year)
  SELECT id, type, category, amount, date, description, is_fixed, target_month, target_year
  FROM transactions 
  WHERE EXTRACT(MONTH FROM date) = target_month 
    AND EXTRACT(YEAR FROM date) = target_year;

  -- Arquivar valores extras
  INSERT INTO archived_extra_income (original_id, amount, description, date, month, year)
  SELECT id, amount, description, date, month, year
  FROM extra_income 
  WHERE month = target_month AND year = target_year;

  -- Limpar dados do mês (manter apenas transações fixas)
  DELETE FROM transactions 
  WHERE EXTRACT(MONTH FROM date) = target_month 
    AND EXTRACT(YEAR FROM date) = target_year
    AND is_fixed = FALSE;

  DELETE FROM extra_income 
  WHERE month = target_month AND year = target_year;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_monthly_summary_month_year ON monthly_summary(month, year);
CREATE INDEX IF NOT EXISTS idx_archived_transactions_month_year ON archived_transactions(month, year);
CREATE INDEX IF NOT EXISTS idx_archived_extra_income_month_year ON archived_extra_income(month, year);

SELECT 'Sistema de histórico criado com sucesso!' as status;
\`\`\`

#### 3. Sistema de Reservas/Poupança

\`\`\`sql
-- ==================== SISTEMA DE RESERVAS ====================

-- Tabela de reservas mensais
CREATE TABLE IF NOT EXISTS monthly_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, year)
);

-- View para total acumulado de reservas
CREATE OR REPLACE VIEW total_savings_view AS
SELECT 
  COALESCE(SUM(amount), 0) as total_accumulated,
  COUNT(*) as months_count,
  COALESCE(MAX(created_at), NOW()) as last_update
FROM monthly_savings;

-- Índices para reservas
CREATE INDEX IF NOT EXISTS idx_monthly_savings_month_year ON monthly_savings(month, year);

SELECT 'Sistema de reservas criado com sucesso!' as status;
\`\`\`

#### 4. Sistema de Cartões de Crédito

\`\`\`sql
-- ==================== SISTEMA DE CARTÕES ====================

-- Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  credit_limit DECIMAL(10,2) NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações de cartão
CREATE TABLE IF NOT EXISTS card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  current_installment INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Geral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de parcelas
CREATE TABLE IF NOT EXISTS card_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_transaction_id UUID NOT NULL REFERENCES card_transactions(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cartões
CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_date ON card_transactions(date);
CREATE INDEX IF NOT EXISTS idx_card_installments_transaction_id ON card_installments(card_transaction_id);
CREATE INDEX IF NOT EXISTS idx_card_installments_due_date ON card_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_card_installments_paid ON card_installments(paid);

SELECT 'Sistema de cartões criado com sucesso!' as status;
\`\`\`

#### 5. Dados de Exemplo (Opcional)

\`\`\`sql
-- ==================== DADOS DE EXEMPLO ====================

-- Inserir cartões de exemplo
INSERT INTO credit_cards (name, credit_limit, closing_day, due_day) VALUES
  ('Nubank', 5000.00, 15, 10),
  ('Itaú', 3000.00, 20, 15),
  ('Bradesco', 2500.00, 25, 20)
ON CONFLICT DO NOTHING;

-- Inserir algumas transações de exemplo para o mês atual
INSERT INTO transactions (type, category, amount, date, description, is_fixed) VALUES
  ('receita', 'Serviços', 3000.00, CURRENT_DATE, 'Receita mensal fixa', true),
  ('gasto', 'Alimentação', 500.00, CURRENT_DATE, 'Supermercado', false),
  ('gasto', 'Transporte', 200.00, CURRENT_DATE, 'Combustível', false),
  ('gasto', 'Internet', 100.00, CURRENT_DATE, 'Internet fixa', true)
ON CONFLICT DO NOTHING;

-- Inserir uma reserva de exemplo
INSERT INTO monthly_savings (month, year, amount, description) VALUES
  (EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), 500.00, 'Reserva de emergência')
ON CONFLICT (month, year) DO NOTHING;

SELECT 'Dados de exemplo inseridos com sucesso!' as status;
\`\`\`

## 📋 Ordem de Execução

1. **Execute o Script 1** - Tabelas Principais
2. **Execute o Script 2** - Sistema de Histórico  
3. **Execute o Script 3** - Sistema de Reservas
4. **Execute o Script 4** - Sistema de Cartões
5. **Execute o Script 5** - Dados de Exemplo (opcional)

## ⚙️ Configuração do Projeto

### 1. Configurar Variáveis de Ambiente

Atualize o arquivo `lib/supabase.ts` com suas credenciais:

\`\`\`typescript
const supabaseUrl = "SUA_URL_DO_SUPABASE"
const supabaseKey = "SUA_CHAVE_PUBLICA_DO_SUPABASE"
\`\`\`

### 2. Instalar Dependências

\`\`\`bash
npm install
\`\`\`

### 3. Executar o Projeto

\`\`\`bash
npm run dev
\`\`\`

## 🔧 Funcionalidades

### Dashboard Principal
- Resumo financeiro mensal
- Alertas e projeções
- Navegação entre meses

### Transações
- Cadastro de receitas e gastos
- Marcação de transações fixas
- Categorização

### Cartões de Crédito
- Cadastro de cartões com limite
- Controle de gastos e parcelamentos
- Visualização de parcelas pendentes
- Resumo por cartão

### Sistema de Reservas
- Registro de reservas mensais
- Metas de poupança
- Gráfico de evolução
- Total acumulado

### Histórico Mensal
- Arquivamento automático
- Preparação do próximo mês
- Manutenção de transações fixas

## 🚨 Troubleshooting

### Erro: "Tabelas não existem"
- Verifique se todos os scripts SQL foram executados
- Confirme se não houve erros durante a execução

### Erro de Conexão
- Verifique as credenciais do Supabase
- Confirme se o projeto está ativo

### Dados não aparecem
- Verifique se as tabelas foram criadas corretamente
- Execute o script de dados de exemplo

## 📊 Estrutura do Banco

\`\`\`
transactions          - Receitas e gastos
monthly_settings      - Configurações mensais (DAS)
extra_income          - Valores extras recebidos
monthly_summary       - Resumos mensais arquivados
archived_transactions - Transações arquivadas
archived_extra_income - Valores extras arquivados
monthly_savings       - Reservas mensais
credit_cards          - Cartões de crédito
card_transactions     - Transações dos cartões
card_installments     - Parcelas das compras
\`\`\`

## 🎯 Próximas Funcionalidades

- [ ] Gráficos avançados
- [ ] Exportação de relatórios
- [ ] Notificações de vencimento
- [ ] Categorias personalizadas
- [ ] Backup automático
- [ ] Autenticação de usuários

---

**Desenvolvido para MEIs que querem ter controle total de suas finanças! 💪**
