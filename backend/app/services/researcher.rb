require "cgi"

# "Idea Researcher": searches four platforms at once for a topic.
module Researcher
  SOURCES = ["GitHub", "Dev.to", "Reddit", "Stack Overflow", "Hacker News", "Hugging Face", "npm", "arXiv"].freeze

  def self.call(query)
    lists = Http.parallel(SOURCES) { |source| search(source, query) }
    SOURCES.zip(lists).map { |source, items| { source: source, items: items || [] } }
  end

  def self.search(source, query)
    q = CGI.escape(query)
    case source
    when "GitHub"
      data = Http.get_json("https://api.github.com/search/repositories?q=#{q}&sort=stars&order=desc&per_page=8",
                           headers: { "Accept" => "application/vnd.github+json" })
      (data&.dig("items") || []).map do |r|
        item(r["full_name"], r["html_url"], source, r["description"], r["stargazers_count"], "stars")
      end
    when "Dev.to"
      tag = query.downcase.gsub(/[^a-z0-9]/, "")
      (Http.get_json("https://dev.to/api/articles?per_page=8&tag=#{tag}") || []).map do |a|
        item(a["title"], a["url"], source, a["description"], a["public_reactions_count"], "reactions")
      end
    when "Reddit" # Reddit often blocks servers; an empty list is fine
      children = Http.get_json("https://www.reddit.com/r/programming/search.json?q=#{q}&restrict_sr=1&sort=relevance&limit=8")&.dig("data", "children") || []
      children.map do |c|
        d = c["data"]
        item(d["title"], "https://www.reddit.com#{d['permalink']}", source, "", d["score"], "upvotes")
      end
    when "Stack Overflow"
      data = Http.get_json("https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=#{q}&site=stackoverflow&pagesize=8")
      (data&.dig("items") || []).map do |i|
        item(CGI.unescapeHTML(i["title"].to_s), i["link"], source, "", i["score"], "votes", i["tags"])
      end
    when "Hacker News"
      data = Http.get_json("https://hn.algolia.com/api/v1/search?query=#{q}&tags=story&hitsPerPage=8")
      (data&.dig("hits") || []).map do |hit|
        url = hit["url"].presence || "https://news.ycombinator.com/item?id=#{hit['objectID']}"
        item(hit["title"], url, source, "", hit["points"], "points")
      end
    when "Hugging Face"
      data = Http.get_json("https://huggingface.co/api/models?search=#{q}&sort=trendingScore&direction=-1&limit=8")
      (data || []).filter_map do |model|
        name = model["modelId"] || model["id"]
        next unless name

        item(name, "https://huggingface.co/#{name}", source, model["pipeline_tag"], model["trendingScore"] || model["downloads"], "trending score", model["tags"])
      end
    when "npm"
      data = Http.get_json("https://registry.npmjs.org/-/v1/search?text=#{q}&size=8")
      (data&.dig("objects") || []).map do |entry|
        package = entry["package"] || {}
        score = entry.dig("score", "final").to_f * 100
        item(package["name"], package["links"]&.dig("npm") || "https://www.npmjs.com/package/#{package['name']}", source, package["description"], score, "relevance")
      end
    when "arXiv"
      xml = Http.get("https://export.arxiv.org/api/query?search_query=all:#{q}&start=0&max_results=8&sortBy=relevance")
      return [] unless xml

      Nokogiri::XML(xml).remove_namespaces!.xpath("//entry").map do |entry|
        title = entry.at_xpath("title")&.text.to_s.gsub(/\s+/, " ").strip
        url = entry.at_xpath("id")&.text.to_s
        authors = entry.xpath("author/name").first(3).map(&:text).join(", ")
        item(title, url, source, authors, 0, "relevance")
      end
    end
  end

  def self.item(title, url, source, description, metric, label, tags = [])
    {
      title: title, url: url, source: source,
      description: description.to_s.truncate(180),
      tags: Normalizer.extract(tags: tags, text: "#{title} #{description}"),
      metric: metric.to_f, metric_label: label
    }
  end
end
