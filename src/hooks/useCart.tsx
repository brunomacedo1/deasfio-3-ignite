import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    
    try {
      const updatedCart = [ ...cart];
      const product = await api.get(`products/${productId}`);
      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;
      const productData = product.data;
      const productExists = updatedCart.find((product) => product.id === productId);
      const productAmount = productExists ? productExists.amount : 0;
      const amount = productAmount + 1;
      
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists){
        productExists.amount = amount;
      } else {
        const newProduct = { ...productData, amount: 1 };
        updatedCart.push(newProduct);
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      toast.success('Item adicionado com sucesso.')
      return;
    } catch (err) {
      toast.error('Erro na adição do produto');
      return;
    }

  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      
      if(productExists){
        const modifiedCart = cart.filter(product => product.id !== productId)
        setCart(modifiedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(modifiedCart))
        return;
      } else {
        toast.error('Erro na remoção do produto');
        return;
      }
    } catch {
      toast.error('Erro na remoção do produto');
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];
      const { data } = await api.get(`stock/${productId}`)
      const stockAmount = data.amount;
      const productExists = updatedCart.find(product => product.id === productId)

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(amount <= 0) {
        return;
      }

      if(productExists){
        productExists.amount = amount;
      }
      
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      return;
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
