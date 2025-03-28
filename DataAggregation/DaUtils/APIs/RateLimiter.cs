using System;
using System.Threading;
using System.Threading.Tasks;

namespace DaUtils.APIs
{
    public class RateLimiter(int maxRequestsPerPeriod, TimeSpan period)
    {
        private int _requestCount;
        private DateTime _lastResetTime = DateTime.UtcNow;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        public async Task WaitAsync(CancellationToken cancellationToken = default)
        {
            await _semaphore.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                var currentTime = DateTime.UtcNow;
                if (currentTime - _lastResetTime > period)
                {
                    _requestCount = 0;
                    _lastResetTime = currentTime;
                }

                while (_requestCount >= maxRequestsPerPeriod)
                {
                    var timeToReset = _lastResetTime + period - currentTime;
                    if (timeToReset > TimeSpan.Zero)
                    {
                        await Task.Delay(timeToReset, cancellationToken).ConfigureAwait(false);
                    }
                    _requestCount = 0;
                    _lastResetTime = DateTime.UtcNow;
                    currentTime = _lastResetTime;
                }

                _requestCount++;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public bool TryWait()
        {
            if (!_semaphore.Wait(0))
            {
                return false;
            }

            try
            {
                var currentTime = DateTime.UtcNow;
                if (currentTime - _lastResetTime > period)
                {
                    _requestCount = 0;
                    _lastResetTime = currentTime;
                }

                if (_requestCount < maxRequestsPerPeriod)
                {
                    _requestCount++;
                    return true;
                }

                return false;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public int MaxRequestsPerPeriod => maxRequestsPerPeriod;

        public TimeSpan Period => period;

        public int RequestCount => _requestCount;

        public DateTime LastResetTime => _lastResetTime;
    }
}