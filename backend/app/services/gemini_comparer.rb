# Fetches 2-5 GitHub READMEs and asks Gemini for a side-by-side Markdown comparison.
module GeminiComparer
  class Error < StandardError; end

  API = "https://generativelanguage.googleapis.com/v1beta/models".freeze

  def self.call(urls)
    key = ENV["GEMINI_API_KEY"].to_s
    raise Error, "GEMINI_API_KEY is not set. Add it to backend/.env and restart the server." if key.blank?

    limit = 40_000 / urls.size # keep the prompt a sensible size when comparing many repos
    repos = urls.map { |url| readme(url, limit) }
    raise Error, "Please choose different repositories." if repos.map { |r| r[:name].downcase }.uniq.size < 2

    generate(prompt(repos), key)
  end

  def self.readme(url, limit)
    match = url.to_s.match(%r{github\.com/([^/\s]+)/([^/\s#?]+)})
    raise Error, "Not a valid GitHub repository URL: #{url}" unless match

    owner = match[1]
    repo = match[2].delete_suffix(".git")
    headers = {
      "Accept" => "application/vnd.github.raw+json",
      "X-GitHub-Api-Version" => "2022-11-28"
    }
    headers["Authorization"] = "Bearer #{ENV['GITHUB_TOKEN']}" if ENV["GITHUB_TOKEN"].present?
    response = Http.request(
      :get,
      "https://api.github.com/repos/#{owner}/#{repo}/readme",
      headers: headers
    )
    unless response.is_a?(Net::HTTPSuccess)
      message = begin
        JSON.parse(response.body).dig("message")
      rescue JSON::ParserError
        nil
      end

      if response.code == "404"
        raise Error, "GitHub could not find a README for #{owner}/#{repo}. Check the repository URL and make sure the repository has a README."
      end

      if %w[403 429].include?(response.code) &&
          (response.code == "429" || response["X-RateLimit-Remaining"] == "0" || message.to_s.match?(/rate limit/i))
        raise Error, "GitHub's unauthenticated API limit was reached. Add a GitHub token as GITHUB_TOKEN in the upstack-api Render environment, then redeploy."
      end

      detail = message.present? ? " GitHub said: #{message.truncate(180)}" : ""
      raise Error, "GitHub could not fetch the README for #{owner}/#{repo} (HTTP #{response.code}).#{detail}"
    end

    text = response.body.to_s.dup.force_encoding("UTF-8").scrub
    raise Error, "GitHub returned an empty README for #{owner}/#{repo}." if text.blank?

    { name: "#{owner}/#{repo}", text: text.truncate(limit) }
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, SystemCallError, OpenSSL::SSL::SSLError => e
    raise Error, "Could not reach GitHub while fetching #{owner}/#{repo}: #{e.message}"
  end

  def self.prompt(repos)
    names = repos.map { |r| r[:name] }
    sections = repos.map { |r| "## Repository: #{r[:name]}\n#{r[:text]}" }.join("\n\n")
    <<~PROMPT
      You are a senior engineer. Compare these #{repos.size} GitHub repositories using only their READMEs.

      Return Markdown with:
      1. A short summary of each project (2-3 sentences each).
      2. One side-by-side table. Columns: "Aspect", #{names.map { |n| "\"#{n}\"" }.join(', ')}. Rows: purpose, tech stack, key features, ease of setup, maturity and community, best suited for.
      3. A short "Verdict" section explaining when to pick each one.

      #{sections}
    PROMPT
  end

  # Retries on overload (503/429) with a short backoff, then tries the fallback model.
  def self.generate(prompt, key)
    models = [ENV.fetch("GEMINI_MODEL", "gemini-3.8-flash"),
              ENV["GEMINI_FALLBACK_MODEL"]].compact_blank.uniq
    last_error = "Gemini request failed."

    models.each do |model|
      3.times do |attempt|
        res = post(model, prompt, key)
        if res.is_a?(Net::HTTPSuccess)
          text = JSON.parse(res.body).dig("candidates", 0, "content", "parts", 0, "text")
          return text if text.present?

          last_error = "Gemini returned an empty answer."
          break
        end

        last_error = "Gemini error (#{res.code}): #{error_message(res)}"
        break unless %w[503 429].include?(res.code)

        sleep(2**attempt)
      end
    end
    raise Error, last_error
  end

  def self.post(model, prompt, key)
    Http.request(:post, "#{API}/#{model}:generateContent",
                 headers: { "Content-Type" => "application/json", "x-goog-api-key" => key },
                 body: { contents: [{ parts: [{ text: prompt }] }] }.to_json,
                 timeout: 60)
  rescue StandardError => e
    raise Error, "Could not reach Gemini: #{e.message}"
  end

  def self.error_message(res)
    JSON.parse(res.body).dig("error", "message").to_s.truncate(200)
  rescue StandardError
    "unknown error"
  end
end
