import { css } from 'lit-element';

export const chatgptStyles = css`


.darkTheme {
    background-color: black;
    color: white;    
    font-family: 'Roboto', sans-serif; 
    font-size: 14px;
}

.sgptHeader {
    height: 32px;
    width: 100%;
    
    border-bottom: 1px solid gray;
}

.headerLeft{
    width:50%;
    float: left;
    text-align: left;
    padding-left: 1%;
    padding-top: 8px;
    font-size: 16px;
    
}

.headerRight{
    width:49%;
    float: left;
    text-align: right;
    padding-top: 8px;
    margin-top: -10px;
    
}

.sgptContainer {
    width: 98%;    
    float: left;    
    border-radius: 2px;             
    height: 99.5vh;   
    border: 1px solid gray;
    line-height: 1.0em;
    margin-left: 1%;
    margin-right: 1%;
}

.sgptSettings{
    height: 100%;
    width: 100%;        
    border-radius: 5px;     
    border:1px solid blue;
    max-height: 220px;        
    clear: both;
    
}

.sgptKeyText{
    float: left;
    width:55%;     
    height: 30px;
    letter-spacing: normal;
    word-spacing: normal;    
    border-radius: 5px;      
    resize: none;  
    margin: 10px;
    border: 1px solid gray;
}

.sgptButtonSetting {   
    float: left;
    width: 10%;
    height: 30px;
    border-radius: 5px;   
    border: 1px solid gray;
    cursor: pointer;
    margin-top: 10px;
}

.sgptResult{
    height: 100%;
    width: 100%;        
    border-radius: 5px;     
    border:0px solid gray;
    max-height: 520px;    
    white-space:pre-wrap;  
    overflow-y: auto;
    clear: both;
}

.showSettings{
    display: block;
}

.hideSettings{
    display: none;
}
.sgptTextPrompt {
    float: left;
    width:78%;     
    height: 100px;
    letter-spacing: normal;
    word-spacing: normal;    
    border-radius: 5px;      
    resize: none;  
    margin: 2px;
}

.sgptButton {   
    float: left;
    width: 19%;
    height: 30px;
    border-radius: 5px;   
    border: 1px solid gray;
    cursor: pointer;
    margin-top: 2px;
}

.darkresult {
    color:yellow;
}
.userspan{
    float: left;
    width: 98%;
    text-align: left;
    padding-bottom: 10px;
    padding-left: 1%;
    padding-right: 1%;
    padding-top: 10px;
    
}

.assistspan{
    float: left;
    width: 98%;
    text-align: left;
    padding-bottom: 1%;
    padding-left: 1%;
    padding-right: 1%;
    border-bottom: 1px dotted white;
}

.responsespan{
    float: left;
    width: 98%;
    text-align: left;
    padding-bottom: 3%;
    padding-left: 1%;
    padding-right: 1%;
    margin-top: -5px;
    padding-top: 0px;
    vertical-align: top;
}

.sgptCommand {

}

.overlay {
    background: rgba(0,0,0,0.5);
    opacity: 0.5;
    pointer-events: none;
    transition:opacity 0.5s ease;
}

`;