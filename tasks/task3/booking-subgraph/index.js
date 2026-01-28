import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fetch from 'node-fetch'; 

const typeDefs = gql`
  type Booking @key(fields: "id") {
    id: ID!
    userId: String!
    hotelId: String!
    promoCode: String
    discountPercent: Int
  }

  type Query {
    bookingsByUser(userId: String!): [Booking]
  }
`;



const resolvers = {
  Query: {
    bookingsByUser: async (_, { userId }, { req }) => {
		try {
        
                
        const response = await fetch(`http://monolith:8080/api/bookings?userId=${userId}`, {
          method: 'GET',
          headers: {
            //'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Booking service responded with status: ${response.status}`);
        }
        
        const bookings = await response.json();
        
        // 3. Возвращаем данные в формате GraphQL
        return bookings.map(booking => ({
          id: booking.id,
          userId: booking.userId,
          hotelId: booking.hotelId,
          promoCode: booking.promoCode || null,
          discountPercent: booking.discountPercent || null
        }));
        
      } catch (error) {
        console.error('Error fetching bookings:', error);
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }
    },
  },
  Booking: {
      
     /* 
     return : {
          id: 7,
          userId: 8,
          hotelId: 9,
          promoCode: null,
          discountPercent: 0
      }
      */    	  
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4001 },
  context: async ({ req }) => ({ req }),
}).then(() => {
  console.log('✅ Booking subgraph ready at http://localhost:4001/');
});
