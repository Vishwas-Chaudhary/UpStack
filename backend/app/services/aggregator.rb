# Scores items and technologies.
#
#   item score  = (10 + 90 * metric / best_metric_on_that_source) * source_weight
#   tech score  = sum(item scores) * (1 + log2(number_of_sources) * 0.8)
#
# The log2 bonus rewards technologies seen on several independent platforms,
# so one viral post on a single site can't dominate the ranking.
module Aggregator
  WEIGHTS = {
    "GitHub" => 1.0, "Hacker News" => 0.8, "Stack Overflow" => 0.7,
    "Dev.to" => 0.6, "Lobsters" => 0.5, "Hugging Face" => 0.9
  }.freeze

  def self.call(raw_items)
    items = score_items(raw_items.select { |i| i[:title].present? && i[:url].present? })
    {
      technologies: technologies(items),
      items: items.sort_by { |i| -i[:score] },
      generated_at: Time.current.iso8601
    }
  end

  def self.score_items(raw)
    best = raw.group_by { |i| i[:source] }
              .transform_values { |list| list.map { |i| [i[:metric], 0].max }.max }

    raw.map do |item|
      top = best[item[:source]].to_f
      norm = top.positive? ? [item[:metric], 0].max / top : 0
      score = (10 + 90 * norm) * WEIGHTS.fetch(item[:source], 0.5)
      techs = Normalizer.extract(tags: item[:tags], text: "#{item[:title]} #{item[:description]}")

      item.merge(
        description: item[:description].to_s.truncate(180),
        score: score.round(1),
        tags: techs,
        categories: techs.map { |t| Normalizer.category(t) }.uniq
      )
    end
  end

  def self.technologies(items)
    groups = Hash.new { |hash, key| hash[key] = [] }
    items.each { |item| item[:tags].each { |tag| groups[tag] << item } }

    groups.map do |name, list|
      sources = list.map { |i| i[:source] }.uniq
      base = list.sum { |i| i[:score] }
      {
        name: name,
        category: Normalizer.category(name),
        score: (base * (1 + Math.log2(sources.size) * 0.8)).round(1),
        source_count: sources.size,
        sources: sources,
        item_count: list.size
      }
    end.sort_by { |t| -t[:score] }.first(100)
  end
end
