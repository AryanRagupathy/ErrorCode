import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity,TextInput,Image } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from "expo-permissions"
import db from "../config.js"
export default class TransactionScreen extends Component{
    constructor(){
        super()
        this.state={
            hasCameraPermissions:null,
            scanned:false, 
            scannedData:"",
            buttonState:"normal",
            scannedBookId:"",
            scannedStudentId:"",
            transactionMessage:""
        }
    }
    getCameraPermissions = async(id) => {
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
             /*
             status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
            hasCameraPermissions: status === "granted",
            buttonState:id,
            scanned:false
        })
    }
    handleBarcodeScanned = async({type,data}) => {
        const {buttonState} = this.state;
        if(buttonState==="bookID"){
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:"normal",
                
            })
        }else if(buttonState==="studentID"){
            this.setState({
                scanned:true,
                scannedStudentId:data,
                buttonState:"normal",
                
            })
        }

    }

    initiateBookIssue = async() => {
         //add a transaction
        db.collection("Transaction").add({
            'studentId' : this.state.scannedStudentId,
            'bookId' : this.state.scannedBookId,
            'date' : firebase.firestore.Timestamp.now().toDate(),
            'transactionType' : "Issue"
        })

        //change book status
        db.collection("Books").doc(this.state.scannedBookId).update({
            'BookAvailability' : false
        })
        //change number of issued books for student
        db.collection("Students").doc(this.state.scannedStudentId).update({
            'NumberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
        })

        this.setState({
            scannedStudentId : '',
            scannedBookId: ''
          })
    }

    initiateBookReturn = async() => {
        db.collection("Transaction").add({
            'studentId' : this.state.scannedStudentId,
            'bookId' : this.state.scannedBookId,
            'date' : firebase.firestore.Timestamp.now().toDate(),
            'transactionType' : "Return"
        })

        //change book status
        db.collection("Books").doc(this.state.scannedBookId).update({
            'BookAvailability' : true
        })
        //change number of issued books for student
        db.collection("Students").doc(this.state.scannedStudentId).update({
            'NumberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedStudentId : '',
            scannedBookId: ''
          })
    }

    handleTransaction = async() => {
        var transactionMessage;
        db.collection("Books").doc(this.state.scannedBookId)
        .get().then((doc) => {
            console.log(doc.data);
            var book = doc.data;
            book.BookAvailability

            if(book.BookAvailability){
                this.initiateBookIssue();
                transactionMessage="Book Issued"
            }else{
                this.initiateBookReturn()
                transactionMessage="Book Returned"
            } 
        
        
        })
        
        this.setState({
            transactionMessage:transactionMessage
        })
    }
    
render(){
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
    if(buttonState !== "normal" && hasCameraPermissions){
        return(
            <BarCodeScanner onBarCodeScanned={scanned?undefined:this.handleBarcodeScanned}
             style = {StyleSheet.absoluteFillObject} />
        )
    }else if(buttonState==="normal"){
        return(
            <View style = {styles.container}>
                <View>
                    <Image source = {require("../assets/booklogo.jpg")} style = {{width:200,height:200}}/>
                    <Text style = {{fontSize:30,textAlign:'center'}}>
                        Wily
                    </Text>
                </View>
                <View style = {styles.inputView}>
                    <TextInput style = {styles.inputBox} placeholder = "Book ID" value={this.state.scannedBookId} />
                    <TouchableOpacity style= {styles.scanButton} onPress={()=>{
						this.getCameraPermissions("bookID")
                    }} 
                    >
                        <Text style = {styles.buttonText}>Scan</Text>
                     </TouchableOpacity>
                </View>
                <View style = {styles.inputView}>
                    <TextInput style = {styles.inputBox} placeholder = "Student ID" value={this.state.scannedStudentId}/>
                    <TouchableOpacity style= {styles.scanButton} onPress={()=>{
                            this.getCameraPermissions("studentID")
                        }}>
                           <Text style = {styles.buttonText2}>Scan</Text>
                        </TouchableOpacity>
                </View>
                <TouchableOpacity style = {styles.submitButton} 
                onPress= {async() => {this.handleTransaction}}>
                    <Text style = {styles.submitText}>Submit</Text>
                </TouchableOpacity>
               
             </View>
        )
    }


}
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
	},
	buttonText2:{
		fontSize: 15,
		textAlign: 'center',
		marginTop: -7
	  },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      height:40,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
        backgroundColor: '#66BB6A',
        width:100,
        height:50
    },
    submitText:{
        padding:10,
        textAlign:"center",
        fontSize:20,
        fontWeight:"bold",
        color:"white"
    }
	
  });