const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class YouTubeClient {
    constructor(ytData){
        this.accessToken = ytData?.accessToken;
        this.refreshToken = ytData?.refreshToken;
        this.expiration = ytData?.expiration;
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
        this.lastRequestTime = null;
        this.rateLimit = 2000; // ms
    }

    async tokenRefresh(maxTries = 3){
        for(let i=0; i<maxTries; i++){
            try{
                const response = await fetch('/google_api/refresh_token?' + new URLSearchParams({refresh_token: this.refreshToken}).toString());
                if(response.ok){
                    const data = await response.json();
                    this.accessToken = data['access_token'];
                    this.refreshToken = data['refresh_token'];
                    this.expiration = data['expiration'];
                    return;
                }
                const msg = await response.text()
                console.error(`Failed to refresh token trying again, ${msg}`);
            } catch (err) {
                console.error(err);
            }
        }
        console.error('Failed to refresh token, exceeded max tries.')
    }

    async delete(endpoint, maxTries = 3){
        for(let i=0; i<maxTries; i++){
            try{
                const curTime = new Date().getTime();
                if(this.lastRequestTime){
                    let elapsedTime = curTime - this.lastRequestTime
                    if(elapsedTime < this.rateLimit)
                        await sleep(this.rateLimit - elapsedTime)
                }
                if(curTime > this.expiration){
                    await this.tokenRefresh();
                }

                this.lastRequestTime = new Date().getTime();
                const response = await fetch(this.baseURL + endpoint, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
                if(response.ok){
                    return response;
                }
                const msg = await response.text()
                console.error(`YouTube Request failed trying again, ${msg}`);
                if(response.status == 401){
                    await this.tokenRefresh();
                }
            }catch(err){
                console.error(err)
            }
        }
        console.error('YouTube Request Failed, Exceeded Max Tries');
    }

    async post(endpoint, payload, maxTries = 3){
        for(let i=0; i<maxTries; i++){
            try{
                const curTime = new Date().getTime();
                if(this.lastRequestTime){
                    let elapsedTime = curTime - this.lastRequestTime
                    if(elapsedTime < this.rateLimit)
                        await sleep(this.rateLimit - elapsedTime)
                }
                if(curTime > this.expiration){
                    await this.tokenRefresh();
                }

                this.lastRequestTime = new Date().getTime(); 
                const response = await fetch(this.baseURL + endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: JSON.stringify(payload)
                });
                if(response.ok){
                    return response;
                }
                const msg = await response.text()
                console.error(`YouTube Request failed trying again, ${msg}`);
                if(response.status == 401){
                    await this.tokenRefresh();
                }
            }catch(err){
                console.error(err)
            }
        }
        console.error('YouTube Request Failed, Exceeded Max Tries');
    }
}
// only allow one youtube client instance
let ytClient = null;
export const getYouTubeClient = (ytData) => {
    if(!ytClient && ytData){
        ytClient = new YouTubeClient(ytData);
    }
    return ytClient;
};