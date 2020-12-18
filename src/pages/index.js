import React from 'react';
import graphql from 'graphql';

import { getPostDate } from '../lib/dates';

import Container from '../ui/Container/Container';
import Card from '../ui/Card/Card';
import Link from '../ui/Link/Link';

const IndexPage = ({ data }) => {
  // There should only be one 'homepage' entry
  const fields = { ...data.allContentfulHomepage.edges[0].node };

  return (
    <div>
      <h1>{fields.title}</h1>
      <p className="c-p -large">{fields.opener}</p>
      <p>
        <Link url={fields.action.url} text={fields.action.text} />
      </p>

      <hr />

      <h2>Posts</h2>
      <Container size="small">
        {fields.posts.map((post, index) => (
          <Card
            key={index}
            title={post.title}
            subtitle={getPostDate(post)}
            link={`blog/${post.slug}`}
            emoji={post.emoji}
          />
        ))}
      </Container>
    </div>
  );
};

export default IndexPage;

export const query = graphql`
  query HomepageQuery {
    allContentfulHomepage {
      edges {
        node {
          id
          title
          opener
          action {
            id
            text
            url
          }
          posts {
            id
            originalPublishDate
            createdAt
            slug
            title
            emoji
            body {
              id
              childMarkdownRemark {
                id
                html
              }
            }
          }
        }
      }
    }
  }
`;
