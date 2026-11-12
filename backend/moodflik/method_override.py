class MethodOverrideMiddleware:
    """Lets clients that cannot send PATCH/PUT/DELETE reliably (some mobile networks and proxies)
    send a POST with `X-HTTP-Method-Override: PATCH` instead."""

    ALLOWED = {"PATCH", "PUT", "DELETE"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        override = request.headers.get("X-HTTP-Method-Override", "").upper()
        if request.method == "POST" and override in self.ALLOWED:
            request.method = override
        return self.get_response(request)
