export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'League Spartan, sans-serif' }}>
          Access Denied
        </h1>
        <p className="text-gray-600 mb-8">
          You need administrator privileges to access this page.
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
            style={{ backgroundColor: '#8FBC8F' }}
          >
            Return to Homepage
          </a>
          <br />
          <a
            href="/auth/signin"
            className="inline-block text-green-600 hover:text-green-700"
          >
            Sign in with different account
          </a>
        </div>
      </div>
    </div>
  );
}