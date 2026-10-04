require "cgi"

# Each method returns an array of plain hashes:
#   { title:, url:, source:, description:, tags:, metric:, metric_label: }
module TrendingSources
  module_function

  def fetch_all
    names = %i[github hacker_news stack_overflow devto lobsters hugging_face]
    Http.parallel(names) { |name| send(name) }.compact.flatten
  end

  # GitHub's API has no "stars this week", so we read the trending page.
  def github
    html = Http.get("https://github.com/trending?since=weekly") or return []
    Nokogiri::HTML(html).css("article.Box-row").first(25).filter_map do |row|
      path = row.at_css("h2 a")&.attr("href")&.strip
      next unless path

      {
        title: path.delete_prefix("/"),
        url: "https://github.com#{path}",
        source: "GitHub",
        description: row.at_css("p")&.text.to_s.strip,
        tags: [row.at_css("[itemprop='programmingLanguage']")&.text.to_s.strip],
        metric: row.text[/([\d,]+)\s+stars this week/, 1].to_s.delete(",").to_f,
        metric_label: "stars this week"
      }
    end
  end

  def hacker_news
    ids = Http.get_json("https://hacker-news.firebaseio.com/v0/topstories.json")&.first(30) or return []
    stories = Http.parallel(ids) { |id| Http.get_json("https://hacker-news.firebaseio.com/v0/item/#{id}.json") }
    stories.filter_map do |s|
      next unless s && s["title"]

      {
        title: s["title"],
        url: s["url"] || "https://news.ycombinator.com/item?id=#{s['id']}",
        source: "Hacker News", description: "", tags: [],
        metric: s["score"].to_f, metric_label: "points"
      }
    end
  end

  def stack_overflow
    data = Http.get_json("https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=30") or return []
    (data["items"] || []).map do |q|
      {
        title: CGI.unescapeHTML(q["title"].to_s), url: q["link"],
        source: "Stack Overflow", description: "", tags: q["tags"],
        metric: q["score"].to_f, metric_label: "votes"
      }
    end
  end

  def devto
    list = Http.get_json("https://dev.to/api/articles?top=7&per_page=30") or return []
    list.map do |a|
      tags = a["tag_list"].is_a?(Array) ? a["tag_list"] : a["tag_list"].to_s.split(",")
      {
        title: a["title"], url: a["url"], source: "Dev.to",
        description: a["description"].to_s, tags: tags,
        metric: a["public_reactions_count"].to_f, metric_label: "reactions"
      }
    end
  end

  def lobsters
    list = Http.get_json("https://lobste.rs/hottest.json") or return []
    list.first(30).map do |s|
      {
        title: s["title"], url: s["url"].presence || s["comments_url"], source: "Lobsters",
        description: s["description"].to_s, tags: s["tags"],
        metric: s["score"].to_f, metric_label: "votes"
      }
    end
  end

  def hugging_face
    models = Http.get_json("https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=30") || []
    models.filter_map do |model|
      name = model["modelId"] || model["id"]
      next unless name

      {
        title: name,
        url: "https://huggingface.co/#{name}",
        source: "Hugging Face",
        description: model["pipeline_tag"].to_s.tr("_", " "),
        tags: Array(model["tags"]) + [model["pipeline_tag"]],
        metric: (model["trendingScore"] || model["downloads"] || model["likes"]).to_f,
        metric_label: model["trendingScore"] ? "trending score" : "downloads"
      }
    end
  end
end
