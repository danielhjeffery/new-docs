import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import styled, { css } from "styled-components";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { MDXProvider } from "@mdx-js/react";
import { Trans } from "@lingui/macro";
import path from "path";
import { Location } from "@reach/router";

import { Column, Container, Row } from "basics/Grid";
import {
  DEFAULT_COLUMN_WIDTH,
  FONT_WEIGHT,
  PALETTE,
  THEME,
  REDESIGN_PALETTE,
} from "constants/styles";
import components from "constants/docsComponentMapping";
import Articles from "components/Documentation/Articles";
import Clock from "assets/icons/clock.svg";
import { DocsBase } from "components/layout/DocsBase";
import { slugify } from "helpers/slugify";
import { Link } from "basics/Links";
import { buildPathFromFile } from "utils";
import { smoothScrollTo } from "helpers/dom";
import { SideNav, SideNavBody, TrackedContent } from "components/SideNav";
import { BasicButton } from "basics/Buttons";

const contentId = "content";
const { h2: H2 } = components;

const StickyEl = styled.div`
  width: 100%;
  height: calc(100vh - 121px);
  top: 121px;
  max-width: ${DEFAULT_COLUMN_WIDTH.leftColumn}rem;
  position: sticky;
  z-index: 3;
`;

const SideNavEl = styled(Column)`
  background-color: ${REDESIGN_PALETTE.grey[0]};
  position: relative;
`;
const SideNavBackgroundEl = styled.div`
  position: absolute;
  background-color: ${REDESIGN_PALETTE.grey[0]};
  left: -100rem;
  right: 0;
  top: -10rem;
  bottom: -10rem;
`;

const Topics = styled.ul`
  list-style-type: none;
  padding: 0;

  button {
    background: none;
    border: 0;
    cursor: pointer;
    padding: 0.375rem 0;
  }
`;

const containerStyles = css`
  margin: 0;
  min-width: 80rem;
  max-width: 140rem;
`;
const ContainerEl = styled(Container)`
  && {
    ${containerStyles}
  }
`;

const ContentEl = styled.article`
  position: relative;
  margin: 0 auto;
`;
const RightNavEl = styled(StickyEl)`
  font-size: 0.875rem;
  line-height: 1rem;
`;
const NavItemEl = styled(BasicButton)`
  display: block;
  margin-bottom: 0.75rem;
  line-height: 1.5rem;
  font-weight: ${FONT_WEIGHT.normal};
  color: ${(props) => (props.isActive ? THEME.text : THEME.lightGrey)};
  &:focus {
    outline: 0;
  }
`;
const OutlineTitleEl = styled.div`
  text-transform: uppercase;
  font-weight: ${FONT_WEIGHT.bold};
  margin-bottom: 1rem;
`;

const RootEl = styled.a`
  color: #333;
  line-height: 1.75rem;
  text-decoration: none;
`;

const NextUpEl = styled.div`
  background-color: ${REDESIGN_PALETTE.grey[0]};
  padding: 1em;
`;

const ModifiedEl = styled.div`
  color: ${THEME.lightGrey};

  svg {
    margin-right: 0.5em;
  }
`;
const ApiLink = styled.li`
  border-top: 1px solid ${PALETTE.white60};
  padding: 0.375rem 0;
`;

const PageOutlineItem = ({ id, isActive, title }) => (
  <NavItemEl
    isActive={isActive}
    onClick={(e) => {
      e.preventDefault();
      smoothScrollTo(document.getElementById(id));
    }}
  >
    {title}
  </NavItemEl>
);

const StyledLink = components.a;
const componentMapping = {
  ...components,
  // eslint-disable-next-line react/prop-types
  a: React.forwardRef(function DocsLink({ href, ...props }, ref) {
    return (
      <Location>
        {({ location }) => {
          let url = href.split(".mdx")[0].replace("index", "");
          if (url.startsWith(".")) {
            url = path.resolve(location.pathname, url);
          }
          return <StyledLink ref={ref} href={url} {...props} />;
        }}
      </Location>
    );
  }),
  // eslint-disable-next-line react/prop-types
  h2: ({ children }) => (
    <TrackedContent id={slugify(children)}>
      <H2>{children}</H2>
    </TrackedContent>
  ),
};

const buildUrlFromPath = (relPath) =>
  `/developers${buildPathFromFile(relPath)}`;

const buildRelPath = (relativeDirectory, rootDir) =>
  relativeDirectory.replace(rootDir, "") || "/";

const nextUp = (topicArr, topicIndex, childArr, childIndex) => {
  // End of list
  if (topicIndex + 1 === topicArr.length) {
    return { title: "", url: "" };
  }

  // Go to next topic
  if (childIndex === childArr.length - 1) {
    const nextTopic = topicArr[topicIndex + 1];
    return {
      title: nextTopic.nodes[0].fields.metadata.data.title,
      url: `${buildUrlFromPath(nextTopic.nodes[0].relativePath)}`,
    };
  }

  // Go to next article in topic
  const nextChild = childArr[childIndex + 1];
  return {
    title: nextChild.childMdx.frontmatter.title,
    url: buildUrlFromPath(nextChild.relativePath),
  };
};

const findChild = (pagePath, docsContents, isNested = false) => {
  if (!pagePath) return docsContents.articles;
  const levels = pagePath.split("/");
  return findChild(
    levels[2] ? `/${levels[2]}` : null,
    isNested
      ? docsContents.articles[`/${levels[1]}`]
      : docsContents[`/${levels[1]}`],
    true,
  );
};

const insertChild = (pagePath, contents, articles, payload) => {
  const currentNode = contents;

  const enterDir = (remainingPath, newNode, isNested) => {
    if (!remainingPath) {
      Object.assign(newNode, payload);
      Object.assign(newNode.articles, articles);
      return contents;
    }
    const levels = remainingPath.split("/");

    if (!levels[1]) {
      Object.assign(newNode, { "/": { articles: {} } });
    } else if (!newNode || !newNode[`/${levels[1]}`]) {
      if (isNested) {
        Object.assign(newNode.articles, {
          [`/${levels[1]}`]: { articles: {} },
        });
      } else {
        Object.assign(newNode, { [`/${levels[1]}`]: { articles: {} } });
      }
    }
    return enterDir(
      levels[2] ? `/${levels[2]}` : null,
      isNested ? newNode.articles[`/${levels[1]}`] : newNode[`/${levels[1]}`],
      true,
    );
  };

  enterDir(pagePath, currentNode, false);
};

const buildDocsContents = (data, rootDir) => {
  const contents = {};
  const sortedDocs = [...data].sort(
    (a, b) =>
      a.nodes[0].fields.metadata.data.order -
      b.nodes[0].fields.metadata.data.order,
  );

  sortedDocs.forEach((topic, topicIndex, topicArr) => {
    const { fieldValue: topicPath } = topic;
    const relPath = buildRelPath(topicPath, rootDir);
    const topicId = topic.nodes[0].id;
    const topicTitle = topic.nodes[0].fields.metadata.data.title;
    const articles = {};

    topic.nodes.forEach((node, childIndex, childArr) => {
      const { childMdx, modifiedTime, name, relativePath } = node;
      const {
        body,
        headings,
        frontmatter: { title: articleTitle },
        id: articleId,
      } = childMdx;
      articles[name] = {
        id: articleId,
        body,
        headings,
        modifiedTime,
        title: articleTitle,
        url: buildUrlFromPath(relativePath),
        nextUp: nextUp(topicArr, topicIndex, childArr, childIndex),
      };
    });
    const payload = {
      id: topicId,
      topicPath: relPath,
      title: topicTitle,
    };
    insertChild(relPath, contents, articles, payload);
  });

  return contents;
};

const Documentation = ({ data, pageContext, location }) => {
  const { allFile } = data;
  const { relativeDirectory, name, rootDir } = pageContext;

  const docsContents =
    (location.state && location.state.compiledDocsContents) ||
    buildDocsContents(allFile.group, rootDir);

  const pagePath = buildRelPath(relativeDirectory, rootDir);

  const initialTopicsState = {};
  Object.values(docsContents).forEach((content) => {
    initialTopicsState[content.topicPath] = content.topicPath === pagePath;
  });
  const article = findChild(pagePath, docsContents)[name];
  const { body, modifiedTime, nextUp: articleNextUp } = article;

  const pageOutline = article.headings.map(({ value }) => ({
    href: `#${slugify(value)}`,
    title: value,
  }));
  const left = (
    <Topics>
      {Object.values(docsContents).map((content) => {
        const { articles, id, topicPath, title } = content;
        if (topicPath === rootDir) {
          return Object.values(articles).map((rootArticle) => (
            <li key={id}>
              <RootEl href="/docs/">{rootArticle.title}</RootEl>
            </li>
          ));
        }
        return (
          <Articles
            id={id}
            articles={articles}
            title={title}
            topicPath={topicPath}
          />
        );
      })}
      <ApiLink>
        <StyledLink href="/docs/api">API Reference</StyledLink>
      </ApiLink>
    </Topics>
  );
  const center = (
    <ContentEl>
      <MDXRenderer>{body}</MDXRenderer>
      <ModifiedEl>
        <Clock />
        Last updated {modifiedTime}
      </ModifiedEl>
      <NextUpEl>
        Next Up:{" "}
        <Link
          href={articleNextUp.url}
          state={{ compiledDocsContents: docsContents }}
        >
          {articleNextUp.title}
        </Link>
      </NextUpEl>
    </ContentEl>
  );
  const right = (
    <RightNavEl>
      <OutlineTitleEl>
        <Trans>Page Outline</Trans>
      </OutlineTitleEl>
      <SideNav>
        <SideNavBody items={pageOutline} renderItem={PageOutlineItem} />
      </SideNav>
    </RightNavEl>
  );

  return (
    <MDXProvider components={componentMapping}>
      <div style={{ marginTop: "10rem" }} />
      <DocsBase pageContext={pageContext}>
        <ContainerEl id={contentId}>
          <Row>
            <SideNavEl md={3} lg={3}>
              <SideNavBackgroundEl />
              <StickyEl>{left}</StickyEl>
            </SideNavEl>
            {/*
                  We want the right hand side to appear above content on mobile
                */}
            <Column md={{ hide: true }}>{right}</Column>
            <Column md={7}>{center}</Column>
            <Column md={2}>{right}</Column>
          </Row>
        </ContainerEl>
      </DocsBase>
    </MDXProvider>
  );
};

Documentation.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.object.isRequired,
  location: PropTypes.object,
};

PageOutlineItem.propTypes = {
  id: PropTypes.string,
  isActive: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

export default Documentation;

export const pageQuery = graphql`
  query DocumentationQuery {
    allFile(
      filter: {
        sourceInstanceName: { eq: "docs" }
        extension: { eq: "mdx" }
        relativePath: { regex: "/src/docs/" }
      }
      sort: { fields: [childMdx___frontmatter___order] }
    ) {
      group(field: relativeDirectory) {
        fieldValue
        nodes {
          id
          modifiedTime(formatString: "MMM. DD, YYYY")
          name
          relativePath
          childMdx {
            body
            headings(depth: h2) {
              value
            }
            id
            frontmatter {
              title
              order
            }
          }
          fields {
            metadata {
              data {
                order
                title
              }
            }
          }
        }
      }
    }
  }
`;
