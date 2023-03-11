import { LitElement, html } from 'lit-element';
import { Configuration, OpenAIApi } from 'openai';
import { chatgptStyles } from './chatgptstyles.js';
import {marked} from 'marked';
import hljs from 'highlight.js';
import {unsafeHTML} from './unsafe-html.js';
//import { unsafeHTML } from 'lit-html/development/directives/unsafe-html';
//import { unsafeHTML } from 'https://jspm.dev/lit-html/directives/unsafe-html.js';


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
        errorMessage: { type: String },
        speechRecognition: {},
        transcript: {}

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
        this.errorMessage = "";
        this.transcript = "";
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

        this.speechInit()
        
    }

    

      get input() {
        return this.renderRoot?.querySelector('#newitem') ?? null;
      }

    changePrompt(event) {    
      this.responseData = '' ;  
        this.prompt = event.target.value;
        this.errorMessage = event.target.value.length + " characters.";
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
        this.errorMessage = "";
        const text =this.prompt;
        if(text === "" || text === null || text === undefined){
          this.errorMessage = "Please enter a prompt."
          return;
        }

        if(text.length < 15){
          this.errorMessage = "Please enter a valid and meaningful prompt with minimum sentence length of 15."
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
        this.errorMessage = "";
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

   formatcode(content){
    const regex = /```(.|\n)*?```/g;
    content = content.replace(regex, match => {
      const code = match.replace(/```/g, '');
      return `<code class="language-javascript">${code}</code>`;
    });
    return content;
   }

   renderMarkdown(content) {
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      },
    });
  
    return html`${unsafeHTML(marked(content))}`;
  }

  speechInit(){
    if ("webkitSpeechRecognition" in window) {
      this.speechRecognition = new window.webkitSpeechRecognition();
          
      this.speechRecognition.continuous = true;
      //this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = "en-US";

      this.speechRecognition.onstart = () => {
        //document.querySelector("#status").style.display = "block";
        this.errorMessage  = "On start";
        this.prompt = "";
        this.transcript = "";
        this.requestUpdate();
      };
      this.speechRecognition.onerror = () => {
        //document.querySelector("#status").style.display = "none";
        //console.log("Speech Recognition Error");
        this.errorMessage  = "Speech Recognition Error";
      };
      this.speechRecognition.onend = () => {
        //document.querySelector("#status").style.display = "none";
        //console.log("Speech Recognition Ended");
        
        if(this.prompt.length >= 15) {
          this.errorMessage  = "Speech Recognition Ended";
          this.onSend()
          this.prompt = "";
          this.transcript ="";
        }
        else{
          this.errorMessage = "Prompt should be greater than 15"
        }
       
      };

      this.speechRecognition.onresult = (event) => {
        // get the latest result
        const result = event.results[event.results.length - 1];
        // get the transcript
        this.transcript += result[0].transcript;
        console.log(this.transcript)
        this.prompt = this.transcript;              
        
        
        //this.requestUpdate();
      };

      
    }else {
      console.log("Speech Recognition Not Available")
    }
  }

  onStart() {
    
    this.speechRecognition.start();
  }

  onStop(){
    this.speechRecognition.stop();
    
    
  }
  render() {
      
      

      return html` 
        <div class="sgptContainer darkTheme">
            <div class="sgptHeader">
              <span class="headerLeft">ChatGPT Turbo</span>
              <span class="headerMiddle"><button class="customButton darkTheme" id="sgptButton" @click=${this.onSetting}>Settings</button></span>
              <span class="headerRight">
              <img src="https://storybook7.blob.core.windows.net/images/sanketterdal.png" alt="Sanket" width="120" height="32"/>&nbsp;
              </span>
            </div>
           <div class="sgptSetting ${this.showSettings ? 'showSettings': 'hideSettings'}">
           
              <input type="text" class="sgptKeyText darkTheme" id="apikey" placeholder="Enter API Key" 
              @input=${this.changeKey}
              value=${this.apikey} />

              <button class="customActionButton darkTheme"  @click=${this.onSave}>Save</button>
              <button class="customActionButton darkTheme"  @click=${this.onCancel}>Cancel</button>
           </div>
           <div class="sgptResult ${this.showSettings ? 'hideSettings': 'showSettings'}" id="sgptResult">
              ${this.chatList.map((item) => html`<span class="${item.role === 'user' ? 'userspan' : 'assistspan darkresult' }">
              ${this.renderMarkdown(item.content)}</span>`)}
               
              <span class="responsespan darkresult">${this.responseData}</span>
             
           </div>
           <div class="sgptCommand ${this.loading ? 'overlay' : '' } ${this.showSettings ? 'hideSettings': 'showSettings'}">
              <textarea class="sgptTextPrompt darkTheme" @input=${this.changePrompt} 
              id="newitem"  placeholder="Enter Prompt.."
              value=${this.prompt}>${this.prompt}</textarea>
                <div class="divAction">
                <span class="divActionLeft">
                <button class="sgptVoiceButton darkTheme" id="sgptButton3" @click=${this.onStart}>S</button>
                <button class="sgptVoiceButton darkTheme" id="sgptButton4" @click=${this.onStop}>E</button>
              </span>
                 
                  <span class="divActionCenter">${this.errorMessage} </span>
                  <span class="divActionRight">
                    <button class="sgptButton  darkTheme" id="sgptButton1" @click=${this.onSend} name="sgptButton">Send</button>
                    <button class="sgptButton sgptButtonMargin darkTheme" id="sgptButton2" @click=${this.onClear}>Clear</button>
                  </span>
                </div>
                
           </div>
           
        </div>
      `;
    }

   
  }
  
  customElements.define('sanket-chatgpt', ChatGPT);