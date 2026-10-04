class TrendingController < ApplicationController
  def index
    data = Rails.cache.read("trending:v2")
    unless data
      data = Aggregator.call(TrendingSources.fetch_all)
      Rails.cache.write("trending:v2", data, expires_in: 10.minutes) if data[:items].any?
    end
    TechnologySnapshot.capture!(data[:technologies])
    render json: data
  end
end
