class RankingsController < ApplicationController
  PERIODS = %w[overall today week month all].freeze

  def index
    period = params[:period].presence || "overall"
    unless PERIODS.include?(period)
      return render json: { error: "Choose overall, today, week, month, or all." }, status: :unprocessable_entity
    end

    if period == "overall"
      data = Rails.cache.read("trending:v2")
      unless data
        data = Aggregator.call(TrendingSources.fetch_all)
        Rails.cache.write("trending:v2", data, expires_in: 10.minutes) if data[:items].any?
      end
      return render json: { period: period, basis: "current ecosystem score", rankings: data[:technologies].first(12) }
    end

    snapshots = TechnologySnapshot.where(snapshot_date: start_date(period)..Time.zone.today)
                                 .order(:snapshot_date)
                                 .to_a
    rankings = snapshots.group_by(&:technology).map do |name, records|
      latest = records.last
      {
        name: name,
        category: latest.category,
        score: records.sum(&:score).fdiv(records.length).round(1),
        source_count: latest.source_count,
        item_count: latest.item_count,
        observed_days: records.length
      }
    end.sort_by { |technology| -technology[:score] }.first(12)

    render json: {
      period: period,
      basis: "average observed daily score",
      snapshot_count: snapshots.length,
      rankings: rankings
    }
  end

  private

  def start_date(period)
    today = Time.zone.today
    case period
    when "today" then today
    when "week" then today.beginning_of_week
    when "month" then today.beginning_of_month
    when "all" then Date.new(2000, 1, 1)
    end
  end
end
