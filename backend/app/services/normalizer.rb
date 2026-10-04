# Turns messy tags / titles into a consistent list of known technologies.
module Normalizer
  # "Canonical name" => [category, aliases]
  TECH = {
    # Frontend
    "React"        => ["Frontend", ["react", "reactjs", "react.js"]],
    "Vue"          => ["Frontend", ["vue", "vuejs", "vue.js"]],
    "Angular"      => ["Frontend", ["angular", "angularjs"]],
    "Svelte"       => ["Frontend", ["svelte", "sveltekit"]],
    "Next.js"      => ["Frontend", ["next.js", "nextjs"]],
    "Astro"        => ["Frontend", ["astro"]],
    "Tailwind CSS" => ["Frontend", ["tailwind", "tailwindcss", "tailwind css"]],
    "JavaScript"   => ["Frontend", ["javascript", "js"]],
    "TypeScript"   => ["Frontend", ["typescript", "ts"]],
    "htmx"         => ["Frontend", ["htmx"]],
    "WebAssembly"  => ["Frontend", ["webassembly", "wasm"]],
    # Backend
    "Node.js"      => ["Backend", ["node.js", "nodejs", "node"]],
    "Python"       => ["Backend", ["python", "python3"]],
    "Ruby"         => ["Backend", ["ruby"]],
    "Rails"        => ["Backend", ["rails", "ruby on rails"]],
    "Django"       => ["Backend", ["django"]],
    "FastAPI"      => ["Backend", ["fastapi"]],
    "Java"         => ["Backend", ["java"]],
    "Spring"       => ["Backend", ["spring", "spring boot"]],
    "Kotlin"       => ["Backend", ["kotlin"]],
    "C#"           => ["Backend", ["c#", "csharp", ".net", "dotnet"]],
    "PHP"          => ["Backend", ["php"]],
    "Laravel"      => ["Backend", ["laravel"]],
    "GraphQL"      => ["Backend", ["graphql"]],
    "PostgreSQL"   => ["Backend", ["postgres", "postgresql"]],
    "SQLite"       => ["Backend", ["sqlite"]],
    "Redis"        => ["Backend", ["redis"]],
    "MongoDB"      => ["Backend", ["mongodb", "mongo"]],
    # AI/ML
    "LLM"          => ["AI/ML", ["llm", "llms", "large language model"]],
    "OpenAI"       => ["AI/ML", ["openai", "chatgpt", "gpt-4", "gpt"]],
    "Claude"       => ["AI/ML", ["claude", "anthropic"]],
    "Gemini"       => ["AI/ML", ["gemini"]],
    "PyTorch"      => ["AI/ML", ["pytorch"]],
    "TensorFlow"   => ["AI/ML", ["tensorflow"]],
    "Hugging Face" => ["AI/ML", ["huggingface", "hugging face"]],
    "LangChain"    => ["AI/ML", ["langchain"]],
    "Ollama"       => ["AI/ML", ["ollama"]],
    "RAG"          => ["AI/ML", ["rag"]],
    "AI Agents"    => ["AI/ML", ["ai agents", "ai agent", "agentic"]],
    "Machine Learning" => ["AI/ML", ["machine learning", "ml"]],
    # Cloud
    "AWS"          => ["Cloud", ["aws", "amazon web services"]],
    "Azure"        => ["Cloud", ["azure", "microsoft azure"]],
    "Google Cloud" => ["Cloud", ["google cloud", "gcp"]],
    "Cloudflare"   => ["Cloud", ["cloudflare"]],
    "Vercel"       => ["Cloud", ["vercel"]],
    "Supabase"     => ["Cloud", ["supabase"]],
    "DigitalOcean" => ["Cloud", ["digitalocean", "digital ocean"]],
    "Fly.io"       => ["Cloud", ["fly.io", "flyio"]],
    # DevOps
    "Docker"       => ["DevOps", ["docker"]],
    "Kubernetes"   => ["DevOps", ["kubernetes", "k8s"]],
    "Terraform"    => ["DevOps", ["terraform"]],
    "GitHub Actions" => ["DevOps", ["github actions"]],
    "Nginx"        => ["DevOps", ["nginx"]],
    "Ansible"      => ["DevOps", ["ansible"]],
    # Data
    "Apache Kafka" => ["Data", ["apache kafka", "kafka"]],
    "Apache Spark" => ["Data", ["apache spark", "spark"]],
    "DuckDB"       => ["Data", ["duckdb"]],
    "ClickHouse"   => ["Data", ["clickhouse", "click house"]],
    "Elasticsearch" => ["Data", ["elasticsearch", "elastic search"]],
    "Snowflake"    => ["Data", ["snowflake"]],
    "dbt"          => ["Data", ["dbt", "data build tool"]],
    # Security
    "Cybersecurity" => ["Security", ["cybersecurity", "cyber security"]],
    "OAuth"        => ["Security", ["oauth", "oauth2", "oauth 2.0"]],
    "Passkeys"     => ["Security", ["passkeys", "passkey"]],
    "Zero Trust"   => ["Security", ["zero trust"]],
    "OpenSSL"      => ["Security", ["openssl"]],
    # Mobile
    "React Native" => ["Mobile", ["react native", "react-native"]],
    "Flutter"      => ["Mobile", ["flutter"]],
    "Expo"         => ["Mobile", ["expo"]],
    "Android"      => ["Mobile", ["android"]],
    "iOS"          => ["Mobile", ["ios", "iphone os"]],
    # Testing
    "Playwright"   => ["Testing", ["playwright"]],
    "Cypress"      => ["Testing", ["cypress"]],
    "Vitest"       => ["Testing", ["vitest"]],
    "Jest"         => ["Testing", ["jest"]],
    # Systems
    "Rust"         => ["Systems", ["rust", "rustlang"]],
    "Go"           => ["Systems", ["go", "golang"]],
    "C++"          => ["Systems", ["c++", "cpp"]],
    "Zig"          => ["Systems", ["zig"]],
    "Linux"        => ["Systems", ["linux"]],
    "Swift"        => ["Systems", ["swift"]]
  }.freeze

  # Too ambiguous to find inside free text (still fine when they come from a tag).
  AMBIGUOUS = %w[go js ts rag ml spring swift astro node gpt mongo spark expo jest].freeze

  ALIAS_TO_NAME = TECH.each_with_object({}) do |(name, (_cat, aliases)), map|
    aliases.each { |a| map[a] = name }
  end.freeze

  CATEGORY = TECH.transform_values(&:first).freeze

  # Matches whole terms only; the lookarounds keep "c#" and "c++" working and stop
  # "java" matching inside "javascript".
  TEXT_ALIASES = ALIAS_TO_NAME.keys.reject { |a| AMBIGUOUS.include?(a) }.sort_by { |a| -a.length }
  TEXT_REGEX = /(?<![\w+#.])(#{TEXT_ALIASES.map { |a| Regexp.escape(a) }.join("|")})(?![\w+#])/i

  def self.from_tags(tags)
    Array(tags).filter_map { |t| ALIAS_TO_NAME[t.to_s.downcase.strip.tr("-_", " ")] }
  end

  def self.from_text(text)
    text.to_s.scan(TEXT_REGEX).flatten.filter_map { |m| ALIAS_TO_NAME[m.downcase] }
  end

  def self.extract(tags:, text:)
    (from_tags(tags) + from_text(text)).uniq
  end

  def self.category(name)
    CATEGORY[name]
  end
end
