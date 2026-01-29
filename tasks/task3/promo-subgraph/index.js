import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fetch from 'node-fetch'; 

const typeDefs = gql`
  
  extend type Booking @key(fields: "id") {
    id: ID! @external
    promoCode: String @external
    discountPercent: Float! @override(from: "booking-subgraph")  
    discountInfo: DiscountInfo @requires(fields: "promoCode")
} 
  
  #тут просто пример нового типа, можно сделать свой
  type DiscountInfo {
    isValid: Boolean!
    originalDiscount: Float!    # Исходное значение из booking
    finalDiscount: Float!       # Актуальное значение после проверки
    description: String
    expiresAt: String
    applicableHotels: [ID!]!
  }
  
  #набор запросов для примера
  type Query {
    validatePromoCode(code: String!, hotelId: ID): DiscountInfo!
     }  
`;



const resolvers = {
  Query: {
    validatePromoCode: async (_, { code, hotelId }) => {
      try {
        // Реальный REST вызов
        const response = await fetch('http://monolith:8080/api/promos/validate?code=${code}&userId=${hotelId}', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',            
          },           
         
        });

        if (!response.ok) {
          throw new Error(`Promo service error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Преобразуем ответ сервиса в формат DiscountInfo
        return {
          isValid: data.isValid,
          originalDiscount: data.originalDiscount,
          finalDiscount: data.finalDiscount,
          description: data.description,
          expiresAt: data.expiresAt,
          applicableHotels: data.applicableHotelIds || []
        };
        
      } catch (error) {
        console.error('Error validating promo code:', error);
        return {
          isValid: false,
          originalDiscount: 0,
          finalDiscount: 0,
          description: `Validation failed: ${error.message}`,
          applicableHotels: []
        };
      }
    },

    activePromoCodes: async () => {
      try {
        const response = await fetch('http://promo-service:8080/api/promocodes/active', {
          headers: { 
            'Authorization': `Bearer ${process.env.PROMO_SERVICE_TOKEN}`
          }
        });

        if (!response.ok) {
          throw new Error(`Promo service error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return data.promoCodes.map((promo: any) => ({
          isValid: promo.isValid,
          originalDiscount: promo.originalDiscount,
          finalDiscount: promo.finalDiscount,
          description: promo.description,
          expiresAt: promo.expiresAt,
          applicableHotels: promo.applicableHotelIds || []
        }));
        
      } catch (error) {
        console.error('Error fetching active promo codes:', error);
        return []; // Возвращаем пустой массив при ошибке
      }
    },
  },
  
  Booking: {
    // Резолвер для Federation
    __resolveReference: (reference) => {
      // Возвращаем только поля, которые есть в reference
      return reference;
    }
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4003 },
  context: async ({ req }) => ({ req }),
}).then(() => {
  console.log('✅ Booking subgraph ready at http://localhost:4003/');
});


