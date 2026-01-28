import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fetch from 'node-fetch'; 
import DataLoader from 'dataloader';


const createHotelLoader = () => {
  return new DataLoader(async (ids) => {
    console.log(`[HotelLoader] Batch loading hotels: ${ids.join(', ')}`);
    
    // Здесь можно сделать batch запрос если API поддерживает
    // Если нет - делаем параллельные запросы
    const hotels = await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await fetch(`http://localhost:8080/hotels/${id}`);
          if (!response.ok) {
            return { id, error: `Not found` };
          }
          return await response.json();
        } catch (error) {
          console.error(`Failed to fetch hotel ${id}:`, error);
          return { id, error: true };
        }
      })
    );
    
    // DataLoader требует сохранять порядок
    return hotels;
  }, {
    batch: true,
    cache: true, // Кэширует результаты
  });
};

const typeDefs = gql`
  type Hotel @key(fields: "id") {
    id: ID!
    name: String
    city: String
    stars: Int
  }

  type Query {
    hotelsByIds(ids: [ID!]!): [Hotel]
  }
`;

const resolvers = {
  Hotel: {
    __resolveReference: async ({ id }) => {
      
       	try {
        
                
        const response = await fetch(`http://monolith:8080/api/hotels/${id}`, {
          method: 'GET',
          headers: {
            //'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Booking service responded with status: ${response.status}`);
        }
        
        const hotels = await response.json();
        
        // 3. Возвращаем данные в формате GraphQL
        return hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          stars: hotel.stars,
        }));
        
      } catch (error) {
        console.error('Error fetching hotels:', error);
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      } 

    },
  },
  Query: {
    hotelsByIds: async (_, { ids }) => {
      // TODO: Заглушка или REST-запрос
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4002 },
}).then(() => {
  console.log('✅ Hotel subgraph ready at http://localhost:4002/');
});
