require "net/http"
require "json"

# Tiny HTTP helper so we don't need any extra gems.
module Http
  UA = "Mozilla/5.0 (compatible; TechEcosystemDashboard/1.0)".freeze

  def self.request(method, url, headers: {}, body: nil, timeout: 8, redirects: 3)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = timeout
    http.read_timeout = timeout

    req = (method == :post ? Net::HTTP::Post : Net::HTTP::Get).new(uri.request_uri)
    req["User-Agent"] = UA
    headers.each { |k, v| req[k] = v }
    req.body = body if body

    res = http.request(req)
    if res.is_a?(Net::HTTPRedirection) && redirects.positive?
      location = URI.join(url, res["location"]).to_s
      return request(method, location, headers: headers, body: body, timeout: timeout, redirects: redirects - 1)
    end
    res
  end

  # Returns the body string, or nil on any failure.
  def self.get(url, headers: {})
    res = request(:get, url, headers: headers)
    res.is_a?(Net::HTTPSuccess) ? res.body.to_s.dup.force_encoding("UTF-8").scrub : nil
  rescue StandardError
    nil
  end

  # Returns parsed JSON, or nil on any failure.
  def self.get_json(url, headers: {})
    body = get(url, headers: headers)
    body && JSON.parse(body)
  rescue JSON::ParserError
    nil
  end

  # Runs the block for each item in its own thread; failed items become nil.
  def self.parallel(items)
    threads = items.map do |item|
      Thread.new do
        yield(item)
      rescue StandardError
        nil
      end
    end
    ActiveSupport::Dependencies.interlock.permit_concurrent_loads { threads.map(&:value) }
  end
end
