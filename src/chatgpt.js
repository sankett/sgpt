import { LitElement, html } from 'lit-element';
import { Configuration, OpenAIApi } from 'openai';
import { chatgptStyles } from './chatgptstyles.js';

/*const openaikey = localStorage.getItem('openai-apikey');
const configuration = new Configuration({
  apiKey: openaikey,
});

const openai = new OpenAIApi(configuration);*/

class ChatGPT extends LitElement { 

    static properties = {
        prompt: {},
        chatList: [],
        arr:[],
        responseData:{
          hasChanged(newVal, oldVal) {
            const hasChanged = newVal !== oldVal;
            //console.log(`${newVal}, ${oldVal}, ${hasChanged}`);
            return hasChanged;
          },
        },
        timeInterval: {},
        loading: { type: Boolean },
        apikey: { type: String },
        openai: { type: Object },
        showSettings: { type: Boolean },
    };

    static styles = [chatgptStyles];


    constructor() {
        super();
        this.prompt = 'Hello, how are you?';
        this.chatList = [];
        this.arr = [];
        this.responseData = '';
        this.timeInterval = null;
        this.loading = false;
        this.apikey = localStorage.getItem('openai-apikey');
        
        if(this.apikey === null || this.apikey === undefined || this.apikey === ''){
          this.showSettings = true;
        }
        else{
          this.showSettings = false;
          const configuration = new Configuration({
            apiKey: this.apikey,
          });
          this.openai = new OpenAIApi(configuration)
        }
        
    }

    

      get input() {
        return this.renderRoot?.querySelector('#newitem') ?? null;
      }

    changePrompt(event) {    
      this.responseData = '' ;  
        this.prompt = event.target.value;
    }

    async fetchData(url,payload) {
        return await fetch(url, {
            method: 'POST',
            headers: {
              "Authorization": 'Bearer ' + this.apikey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
    }

   scrollToBottom() {
    const element = this.renderRoot?.querySelector('#sgptResult');                
    element.scrollTop = element.scrollHeight;    
   }

    async moderation() {
      var payload = {
        input: this.prompt,
      }  
      var result = await  this.fetchData('https://api.openai.com/v1/moderations',payload);
      var data = await result.json();
      var flagged = data.results[0].flagged;
      return flagged;
    }

    loader() {
      let textContent = "Hold on, we're waiting for the server to respond. This shouldn't take too long";
      this.responseData = textContent;
      this.timeInterval = setInterval(() => {
          
          textContent += '.';        
          if (textContent === "Hold on, we're waiting for the server to respond. This shouldn't take too long......") {
              textContent = "Hold on, we're waiting for the server to respond. This shouldn't take too long";
          }
          this.responseData = textContent;
         
      }, 300);
    }
    async completion1() {
      
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: this.chatList,
        stream: true,
      });
         

      const arr = response.data.split("\n\n");      
      let content = "";
      arr.forEach((data) => {
        if (data.indexOf("[DONE]") === -1) { 
          const currentData = data.trim().replace("data:","");          
          if(currentData !== ""){          
            const delta = JSON.parse(currentData).choices[0].delta;
            content += delta.content ? delta.content : "";            
          }
        }
        else{
          
          /*this.chatList.push({"role": "assistant", "content": content});
          this.requestUpdate();
          console.log("its done",this.chatList)*/
          let index = 0
          let textAtIndex =  '';
          
          clearInterval(this.timeInterval);
          let interval = setInterval(() => {
              if (index < content.length) {
                  textAtIndex += content.charAt(index)
                  this.responseData = textAtIndex
                  this.scrollToBottom();   
                  index++
              } else {
                this.responseData = '';
                this.chatList.push({"role": "assistant", "content": content});
                this.loading = false;
                this.input.value = '';
                //this.input.focus();
                this.prompt = "";
                this.scrollToBottom();           
                
                this.requestUpdate();
                clearInterval(interval)
              }
          }, 5)
        }
      });
  }

   

    async onSend(event)   {        
        this.responseData = "";
        const text =this.prompt;
        if(text === "" || text === null || text === undefined){
          this.responseData = "Please enter a prompt."
          return;
        }

        if(text.length < 15){
          this.responseData = "Please enter a valid and meaningful prompt with minimum sentence length of 15."
          return;
        }
        this.loading = true;
        this.chatList.push({ "role": "user", "content": text});       
        this.requestUpdate();
        this.scrollToBottom();
        const result =  await this.moderation();
        if(!result){
            //this.responseData = "Hold on, we're waiting for the server to respond. This shouldn't take too long.....";
            this.loader()        
            this.completion1() 
                    
        }        
    }

    onClear(event) {
        this.chatList = [];
        this.responseData = '';
        this.input.value = '';
        this.prompt = "";
        this.requestUpdate();
    }

   
    onSetting(event) {
      this.showSettings = true;
    }

    onSave(event) {
      
      if(this.apikey === null || this.apikey === undefined || this.apikey === ''){
        return;
      }
      localStorage.setItem('openai-apikey', this.apikey);
     
      this.openai = new OpenAIApi(new Configuration({
        apiKey: this.apikey,
      }))

      this.showSettings = false;
    }

    onCancel(event) {          
      
      if(this.apikey === null || this.apikey === undefined || this.apikey === ''){
        this.showSettings = true;
      }
      else{
        this.showSettings = false;
      }
      
  }

    changeKey(event) {           
        this.apikey = event.target.value;
    }



    render() {
      return html` 
        <div class="sgptContainer darkTheme">
            <div class="sgptHeader">
              <span class="headerLeft">Chat with GPT-3</span>
              <span class="headerMiddle"><button class="customButton darkTheme" id="sgptButton" @click=${this.onSetting}>Settings</button></span>
              <span class="headerRight">
              <img src="https://storybook7.blob.core.windows.net/images/sanketterdal.png" alt="Sanket" width="120" height="32"/>&nbsp;
              </span>
            </div>
           <div class="sgptSetting ${this.showSettings ? 'showSettings': 'hideSettings'}">
              <input type="text" class="sgptKeyText darkTheme" id="apikey" placeholder="Enter API Key" 
              @input=${this.changeKey}
              value=${this.apikey} />

              <button class="sgptButtonSetting darkTheme"  @click=${this.onSave}>Save</button>
              <button class="sgptButtonSetting darkTheme"  @click=${this.onCancel}>Cancel</button>
           </div>
           <div class="sgptResult ${this.showSettings ? 'hideSettings': 'showSettings'}" id="sgptResult">
              ${this.chatList.map((item) => html`<span class="${item.role === 'user' ? 'userspan' : 'assistspan darkresult' }">${item.content.trim()}</span>`)}
              
              <span class="responsespan darkresult">${this.responseData}</span>
             
           </div>
           <div class="sgptCommand ${this.loading ? 'overlay' : '' } ${this.showSettings ? 'hideSettings': 'showSettings'}">
              <textarea class="sgptTextPrompt darkTheme" @input=${this.changePrompt} 
              id="newitem"  placeholder="Enter Prompt.."
              value=${this.prompt}>${this.prompt}</textarea>
                
                <button class="sgptButton darkTheme" id="sgptButton" 
                @click=${this.onSend}
                name="sgptButton">Send</button><br>
                <button class="sgptButton darkTheme" id="sgptButton" @click=${this.onClear}>Clear</button><br>
                
           </div>
        </div>
      `;
    }
  }
  
  customElements.define('sanket-chatgpt', ChatGPT);