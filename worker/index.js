// Minimal Worker that delegates every request to the static assets bundle.
// Required to overwrite the default "Hello World" script that CF generates when
// the project is created as a Worker-with-Assets from the dashboard.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
