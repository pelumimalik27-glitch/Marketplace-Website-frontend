import { createContext, useContext, useState } from "react";



const CustomerContext = createContext()

const  CustomerProvider = ({children})=>{
const [customer,setCustomer] = useState({
    id: 1,
    name: "John Doe",
    phone: "555-0123",
    address: "123 Main St",
    email: "john@example.com",
    isLoggedIn: true,  
})

const updateCustomer = (updateData)=>{
    setCustomer(prev=>({
    ...prev,
    ...updateData,
    }))
}

const loginCustomer = (customerData)=>{
    setCustomer({
    ...customerData,
    isLoggedIn:true,
    })

}
const logoutCustomer = (customerData)=>{
setCustomer (null)
}
return(
    <CustomerContext.Provider value={{
        customer,
         updateCustomer,
        loginCustomer,
        logoutCustomer,

    }}>
        {children}

    </CustomerContext.Provider>
)

}
export {CustomerContext,CustomerProvider}

export const useCustomer = ()=>{
    const context = useContext(CustomerContext)
    if (!context){
        throw new Error("useCustomer must be used inside CustomerProvider")
    }
    return context;
}

