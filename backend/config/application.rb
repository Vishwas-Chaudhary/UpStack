require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module TechEcosystem
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true
    config.cache_store = :memory_store
    config.filter_parameters += [:password, :token]
  end
end
