class TechnologiesController < ApplicationController
  def show
    name = params[:name].to_s
    data = Rails.cache.read("trending:v2")
    technology = data&.dig(:technologies)&.find { |item| item[:name].casecmp?(name) }
    history = TechnologySnapshot.where("LOWER(technology) = ?", name.downcase).order(:snapshot_date).last(30)

    return render json: { error: "Technology not found" }, status: :not_found if technology.nil? && history.empty?

    items = Array(data&.dig(:items)).select do |item|
      Array(item[:tags]).any? { |tag| tag.casecmp?(name) }
    end.sort_by { |item| -item[:score].to_f }.first(12)

    render json: {
      technology: technology || {
        name: name,
        category: history.last.category,
        score: history.last.score,
        source_count: history.last.source_count,
        item_count: history.last.item_count
      },
      history: history.map { |snapshot| snapshot.as_json(only: %i[snapshot_date score source_count item_count]) },
      items: items
    }
  end
end
