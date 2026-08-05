-- Multi-vertical platform V0 (.plans/vertical-platform.implementation-plan.md):
-- vertical as a data dimension. All existing prompt rows become the 'default'
-- (chiro-tuned) set; all existing accounts become vertical 'chiro'. Chiro has
-- no override rows, so resolution falls through to 'default' → byte-identical
-- prompts (zero behavior change).

ALTER TABLE "accounts" ADD COLUMN "vertical" TEXT NOT NULL DEFAULT 'chiro';

ALTER TABLE "prompt_templates" ADD COLUMN "vertical" TEXT NOT NULL DEFAULT 'default';

DROP INDEX "prompt_templates_stepNumber_key";
DROP INDEX "prompt_templates_key_key";

CREATE UNIQUE INDEX "prompt_templates_stepNumber_vertical_key" ON "prompt_templates"("stepNumber", "vertical");
CREATE UNIQUE INDEX "prompt_templates_key_vertical_key" ON "prompt_templates"("key", "vertical");
