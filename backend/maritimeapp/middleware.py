class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = 'OPTIONS, GET, HEAD, POST'  # Allow POST and OPTIONS methods
        response["Access-Control-Allow-Headers"] = "*"
        return response

    # def process_response(self, request, response):
    #     response["Access-Control-Allow-Origin"] = "*"  # Set the appropriate origin(s) or use "*" for any origin
    #     response["Access-Control-Allow-Methods"] = "POST, OPTIONS"  # Allow POST and OPTIONS methods
    #     response["Access-Control-Allow-Headers"] = "Content-Type"  # Set the appropriate allowed headers
    #     return response
