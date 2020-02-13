import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { navigate } from "@reach/router";
import { CopyToClipboard } from "react-copy-to-clipboard";

import ExternalLinkIcon from "assets/icons/icon-external-link.svg";
import CopyIcon from "assets/icons/icon-copy.svg";

import { PALETTE, FONT_FAMILY, FONT_WEIGHT } from "constants/styles";
import { DocPrismStyles } from "basics/NewDocPrism";
import { Link } from "basics/Links";
import { Select } from "basics/Inputs";
import { getCookie, extractStringChildren } from "utils";

const CODE_LANGS = {
  curl: "cURL",
  go: "Go",
  javascript: "JavaScript",
  java: "Java",
};

const LangSelect = styled(Select)`
  width: auto;
  display: inline-block;
  margin: 0;
  padding-right: 1rem;

  select {
    display: inline-block;
    border: none;
    background: transparent;
    color: ${PALETTE.white};
    font-family: ${FONT_FAMILY.monospace};
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
`;

const OptionsContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;

  & > * {
    margin-left: 1rem;
  }
`;

const MethodContentEl = styled.div`
  position: relative;
  border-radius: 4px;
`;

const ContentEl = styled.div`
  padding: 1rem;
`;

const CodeExampleEl = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;

  div {
    background: #292d3e;
  }

  thead {
    display: none;
  }

  td {
    border: none;
    padding: 0.5rem 0;

    &:first-child {
      color: ${PALETTE.purple};
      font-weight: ${FONT_WEIGHT.bold};
      padding-right: 1rem;
    }
  }
`;

const TitleEl = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 1.5rem;
  align-items: center;
  padding-top: 0.2rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 0;
  color: ${PALETTE.white};
  border-bottom: 1px solid ${PALETTE.white60};
  font-size: 0.875rem;
  font-weight: ${FONT_WEIGHT.bold};
`;

const CopiedMessageText = styled.span`
  position: absolute;
  display: block;
  color: ${PALETTE.white};
  background: ${PALETTE.purple};
  right: -1.5rem;
  top: -1.75rem;
  padding: 0.25rem;
`;

const mdxJsxToString = (jsx) => {
  const { props } = jsx;
  const { children } = props;
  let str;

  if (children.props.children.length > 0) {
    str = children.props.children[0].props.children.map((codeSnippet) =>
      extractStringChildren(codeSnippet),
    );
  }

  return str.join("");
};

const CodeSnippet = ({ codeSnippets, title, href }) => {
  const SelectRef = React.createRef(null);
  const availableLangs = React.Children.map(
    codeSnippets,
    (eachLang) => eachLang.props["data-language"],
  );
  const [activeLang, setActiveLang] = React.useState("");
  const [isCopied, setCopy] = React.useState(false);
  const codeSnippetsArr = React.Children.toArray(codeSnippets);
  const selectedSnippet =
    codeSnippetsArr.find(
      (snippet) => snippet.props["data-language"] === activeLang,
    ) || codeSnippetsArr[0];
  const SelectedSnippetStr = mdxJsxToString(selectedSnippet);

  const onChange = React.useCallback((e) => {
    const { value } = e.target;
    document.cookie = `lang=${value}`;
    navigate(`?lang=${value}`, { replace: true });
    setActiveLang(value);
  }, []);

  React.useEffect(() => {
    const langCookie = getCookie("lang");
    if (langCookie) {
      setActiveLang(langCookie);
    } else {
      setActiveLang(availableLangs[0]);
    }
  }, [availableLangs]);

  return (
    <MethodContentEl>
      <TitleEl>
        {title}
        <OptionsContainer>
          <LangSelect
            ref={SelectRef}
            onChange={onChange}
            name="langSelect"
            label=""
            value={activeLang}
          >
            {availableLangs.map((langValue) => (
              <option key={langValue} value={langValue}>
                {CODE_LANGS[langValue]}
              </option>
            ))}
          </LangSelect>
          {isCopied && <CopiedMessageText>Copied</CopiedMessageText>}
          <CopyToClipboard
            text={SelectedSnippetStr && SelectedSnippetStr}
            onCopy={() => {
              setCopy((x) => !x);
            }}
          >
            <CopyIcon />
          </CopyToClipboard>

          {href && (
            <Link href={href} newTab>
              <ExternalLinkIcon />
            </Link>
          )}
        </OptionsContainer>
      </TitleEl>
      <ContentEl>
        <DocPrismStyles isCodeSnippet />
        {selectedSnippet}
      </ContentEl>
    </MethodContentEl>
  );
};

CodeSnippet.propTypes = {
  codeSnippets: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  href: PropTypes.string,
};

/**
 * Note: This exports a React component instead of a styled-component.
 * [Design Mockup](https://zpl.io/V1DGqJ5)
 */

export const CodeExample = React.forwardRef(function CodeExample(
  { title, children, href, ...props },
  ref,
) {
  return (
    <CodeExampleEl ref={ref} {...props}>
      <CodeSnippet codeSnippets={children} title={title} href={href} />
    </CodeExampleEl>
  );
});

CodeExample.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  href: PropTypes.string,
};