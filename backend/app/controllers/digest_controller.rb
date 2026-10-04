class DigestController < ApplicationController
  def show
    data = Rails.cache.read("trending:v2")
    unless data
      data = Aggregator.call(TrendingSources.fetch_all)
      Rails.cache.write("trending:v2", data, expires_in: 10.minutes) if data[:items].any?
    end

    highlights = data[:items].sort_by { |item| -item[:score].to_f }
    balanced = highlights.each_with_object([]) do |item, list|
      next if list.any? { |existing| existing[:source] == item[:source] }

      list << item
      break list if list.size == 5
    end

    render json: {
      generated_at: data[:generated_at],
      technologies: data[:technologies].first(5),
      stories: balanced,
      item_count: data[:items].size
    }
  end
end
