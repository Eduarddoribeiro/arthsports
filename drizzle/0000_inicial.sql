CREATE TYPE "public"."etapa" AS ENUM('arte', 'costura', 'acabamento', 'entregue');--> statement-breakpoint
CREATE TYPE "public"."papel" AS ENUM('admin');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('ativo', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_cliente" AS ENUM('time', 'escola', 'empresa');--> statement-breakpoint
CREATE TYPE "public"."tipo_pagamento" AS ENUM('sinal', 'saldo');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"tipo" "tipo_cliente" NOT NULL,
	"responsavel" text DEFAULT '' NOT NULL,
	"telefone" text DEFAULT '' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etapas_pedido" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"etapa" "etapa" NOT NULL,
	"em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"peca_id" integer NOT NULL,
	"grade" jsonb NOT NULL,
	"quantidade" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"tipo" "tipo_pagamento" NOT NULL,
	"valor_centavos" integer NOT NULL,
	"data" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pecas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"prazo_min_dias" integer NOT NULL,
	"prazo_max_dias" integer NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pedidos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1001 CACHE 1),
	"cliente_id" integer NOT NULL,
	"status" "status_pedido" DEFAULT 'ativo' NOT NULL,
	"etapa_atual" "etapa" DEFAULT 'arte' NOT NULL,
	"valor_total_centavos" integer NOT NULL,
	"sinal_centavos" integer NOT NULL,
	"data_sinal" date NOT NULL,
	"entrega_calculada" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"papel" "papel" DEFAULT 'admin' NOT NULL,
	"senha_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etapas_pedido" ADD CONSTRAINT "etapas_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_peca_id_pecas_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."pecas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "etapas_pedido_idx" ON "etapas_pedido" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "itens_pedido_idx" ON "itens_pedido" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "pagamentos_pedido_idx" ON "pagamentos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "pedidos_cliente_idx" ON "pedidos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "pedidos_status_idx" ON "pedidos" USING btree ("status","etapa_atual");